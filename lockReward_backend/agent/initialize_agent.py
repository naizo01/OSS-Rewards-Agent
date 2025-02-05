import os
import constants
import json

from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import create_react_agent

from cdp_langchain.agent_toolkits import CdpToolkit
from cdp_langchain.utils import CdpAgentkitWrapper
from cdp import Wallet
from cdp_langchain.tools import CdpTool
from pydantic import BaseModel, Field

from db.wallet import add_wallet_info, get_wallet_info
from agent.custom_actions.get_latest_block import get_latest_block
from db.rewards import add_reward

CONTRACT_ADDRESS = "0xe65A5DcD5daDecDEB2A134Acdfdddb9313eBff3E"
TOKEN_ADDRESS = "0x3724091348776cC2C1FF205Fd500A4B0787B110D"
uint256_max = 2**250 - 1

# Load ABI from JSON file
def load_abi(file_path: str):
    with open(file_path, 'r') as file:
        return json.load(file)


def approve_token(wallet: Wallet, spender: str, value: str, token_address: str) -> str:
    """Approve tokens for spending.

    Args:
        wallet (Wallet): The wallet to use for the transaction.
        spender (str): The address of the spender.
        value (int): The amount of tokens to approve.
        token_address (str): The address of the token contract.

    Returns:
        str: The result of the contract invocation.
    """
    abi = load_abi('./agent/erc20_abi.json')  # Update the path as needed
    method = "approve"
    approve_args = {
        "spender": spender,
        "value": value
    }

    result = wallet.invoke_contract(
        contract_address=token_address,
        method=method,
        abi=abi,
        args=approve_args
        ).wait()
    return f"Tokens approved successfully: {result}"

# Define a custom action for invoking the lockReward method.
class LockRewardInput(BaseModel):
    """Input argument schema for locking a reward."""
    repositoryName: str = Field(..., description="The name of the GitHub repository.")
    issueId: int = Field(..., description="The ID of the issue.")
    reward: int = Field(..., description="The amount of reward to lock.")

def lock_reward(wallet: Wallet, repositoryName: str, issueId: int, reward: int) -> str:
    """Lock a reward in the smart contract.

    Args:
        wallet (Wallet): The wallet to use for the transaction.
        repositoryName (str): The name of the GitHub repository.
        issueId (int): The ID of the issue.
        reward (int): The amount of reward to lock.

    Returns:
        str: The result of the contract invocation.
    """
    # Approve tokens before locking reward
    approve_result = approve_token(wallet, CONTRACT_ADDRESS, str(uint256_max), TOKEN_ADDRESS)
    print(approve_result)

    abi = load_abi('./agent/contract_abi.json')  # Update the path as needed
    method = "lockReward"
    lock_reward_args = {
        "repositoryName": repositoryName,
        "issueId": str(issueId),
        "reward": str(reward),
        "tokenAddress": TOKEN_ADDRESS
    }

    try:
        # Invoke the lockReward method on the contract
        lock_reward_invocation = wallet.invoke_contract(
            contract_address=CONTRACT_ADDRESS,
            abi=abi,
            method="lockReward",
            args=lock_reward_args
        ).wait()

        # If the invocation is successful, add the reward to the database
        if lock_reward_invocation:
            success = add_reward(repositoryName, issueId, reward)
            if success:
                print(f"Successfully added reward for {repositoryName} issue {issueId}")
            else:
                print(f"Failed to add reward for {repositoryName} issue {issueId}")

        return f"Reward locked successfully: {lock_reward_invocation}"
    except Exception as e:
        return f"Failed to lock reward: {str(e)}"

def initialize_agent():
    """Initialize the agent with CDP Agentkit."""
    # Initialize LLM.
    llm = ChatOpenAI(model=constants.AGENT_MODEL)

    # Read wallet data from environment variable or database
    wallet_id = os.getenv(constants.WALLET_ID_ENV_VAR)
    wallet_seed = os.getenv(constants.WALLET_SEED_ENV_VAR)
    wallet_info = json.loads(get_wallet_info()) if get_wallet_info() else None

    # Configure CDP Agentkit Langchain Extension.
    values = {}

    # Load agent wallet information from database or environment variables
    if wallet_info:
        wallet_id = wallet_info["wallet_id"]
        wallet_seed = wallet_info["seed"]
        print("Initialized CDP Agentkit with wallet data from database:", wallet_id, wallet_seed, flush=True)
        values = {"cdp_wallet_data": json.dumps({ "wallet_id": wallet_id, "seed": wallet_seed })}
    elif wallet_id and wallet_seed:
        print("Initialized CDP Agentkit with wallet data from environment:", wallet_id, wallet_seed, flush=True)
        values = {"cdp_wallet_data": json.dumps({ "wallet_id": wallet_id, "seed": wallet_seed })}

    agentkit = CdpAgentkitWrapper(**values)

    # Export and store the updated wallet data back to environment variable
    wallet_data = agentkit.export_wallet()
    add_wallet_info(json.dumps(wallet_data))
    print("Exported wallet info", wallet_data, flush=True)

    # Initialize CDP Agentkit Toolkit and get tools.
    cdp_toolkit = CdpToolkit.from_cdp_agentkit_wrapper(agentkit)
    tools = cdp_toolkit.get_tools()
    # Debug: Check if tools is None
    if tools is None:
        raise ValueError("Failed to retrieve tools from CDP Toolkit. Please check the toolkit initialization.")

    # Define a new tool for locking rewards.
    lockRewardTool = CdpTool(
        name="lock_reward",
        description="This tool allows the agent to lock rewards in the smart contract.",
        cdp_agentkit_wrapper=agentkit,
        args_schema=LockRewardInput,
        func=lock_reward,
    )

    all_tools = tools + [lockRewardTool]

    # Store buffered conversation history in memory.
    memory = MemorySaver()

    # Create ReAct Agent using the LLM and CDP AgentKit tools.
    return create_react_agent(
        llm,
        tools=all_tools,
        checkpointer=memory,
        state_modifier=constants.AGENT_PROMPT,
    )