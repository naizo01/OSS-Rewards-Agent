import os
import constants
import json
import re
import requests

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

CONTRACT_ADDRESS = "0x39d449b6f2634B464704Cb079578131dfD5BE3c6"
TOKEN_ADDRESS = "0x3724091348776cC2C1FF205Fd500A4B0787B110D"
uint256_max = 2**250 - 1

# ----------------------------------------------------------------------
# Helper functions for GitHub comment posting
# ----------------------------------------------------------------------

def format_reward_comment(reward_amount, transaction_hash):
    """
    Formats a Markdown comment containing the reward information in a table format.
    """
    markdown = "### Reward Information\n\n"
    markdown += "| Reward Amount | Transaction Hash |\n"
    markdown += "|---------------|------------------|\n"
    markdown += f"| {reward_amount} | {transaction_hash} |\n"
    return markdown

def extract_repo_info(repo_str):
    """
    Extracts the repository owner and name from the provided repository string.
    
    The repository string should be provided in one of the following forms:
      - "naizo01/agentic"
      - "https://github.com/naizo01/agentic"
    
    Returns:
        (owner, repository_name)
        
    Raises:
        ValueError: If the repository string does not include the owner and repository name.
    """
    prefix = "https://github.com/"
    if repo_str.startswith(prefix):
        stripped = repo_str[len(prefix):]
        if "/" in stripped:
            owner, repo = stripped.split("/", 1)
            return owner, repo
        else:
            raise ValueError("Invalid repository format in URL. Expected format: 'owner/repository'.")
    else:
        if "/" in repo_str:
            owner, repo = repo_str.split("/", 1)
            return owner, repo
        else:
            raise ValueError("Invalid repository format: missing '/'. Please provide the repository name in the format 'owner/repository' (e.g. 'naizo01/agentic').")

def extract_transaction_hash(response_text):
    """
    Extracts the transaction hash URL from the given response text.
    Expects a URL starting with "https://sepolia.basescan.org/tx/".
    """
    match = re.search(r"(https://sepolia\.basescan\.org/tx/\S+)", response_text)
    if match:
        return match.group(1)
    else:
        return "Not Available"

def post_github_comment(url, data):
    """
    Sends a POST request to GitHub's API to post a comment.
    Requires the environment variable 'GITHUB_TOKEN' to be set.
    """
    token = os.environ["GITHUB_TOKEN"]  # KeyError if not set
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json"
    }
    response = requests.post(url, json=data, headers=headers)
    response.raise_for_status()  # Raises an exception if the request failed
    return response.json()

def extract_repo_name(url: str) -> str:
    """
    GitHubのリポジトリURLからリポジトリ名を抽出します。
    例: "https://github.com/naizo01/agentic" -> "naizo01/agentic"
    """
    match = re.search(r'github\.com/([^/]+/[^/]+)', url)
    if match:
        return match.group(1)
    else:
        raise ValueError("有効なGitHubリポジトリURLではありません")

# ----------------------------------------------------------------------
# Approve token and lock_reward functions
# ----------------------------------------------------------------------

# Load ABI from JSON file
def load_abi(file_path: str):
    with open(file_path, 'r') as file:
        return json.load(file)

def approve_token(wallet: Wallet, spender: str, value: str, token_address: str) -> str:
    """Approve tokens for spending.

    Args:
        wallet (Wallet): The wallet to use for the transaction.
        spender (str): The address of the spender.
        value (str): The amount of tokens to approve.
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

# Define a custom action input schema for locking rewards.
class LockRewardInput(BaseModel):
    """Input argument schema for locking a reward."""
    repositoryName: str = Field(
        ...,
        description="The full name of the GitHub repository in the format 'owner/repository' (e.g. 'naizo01/agentic')."
    )
    issueId: int = Field(..., description="The ID of the issue.")
    reward: int = Field(..., description="The amount of reward to lock.")
    userAddress: str = Field(..., description="The address of the user.")
    signature: str = Field(..., description="The signature from the user to verify the transaction.")

def lock_reward(wallet: Wallet, repositoryName: str, issueId: int, reward: int, userAddress: str, signature: str) -> str:
    """Lock a reward in the smart contract.

    Args:
        wallet (Wallet): The wallet to use for the transaction.
        repositoryName (str): The full name of the GitHub repository in the format 'owner/repository'.
        issueId (int): The ID of the issue.
        reward (int): The amount of reward to lock.

    Returns:
        str: The result of the contract invocation.
    """
    # リポジトリ名がURL形式の場合、変換する
    if repositoryName.startswith("https://github.com/"):
        repositoryName = extract_repo_name(repositoryName)

    # Approve tokens before locking reward
    # approve_result = approve_token(wallet, CONTRACT_ADDRESS, str(uint256_max), TOKEN_ADDRESS)
    # print(approve_result)

    abi = load_abi('./agent/contract_abi.json')  # Update the path as needed
    method = "lockReward"
    lock_reward_args = {
        "repositoryName": repositoryName,
        "issueId": str(issueId),
        "reward": str(reward * 10**18),
        "tokenAddress": TOKEN_ADDRESS,
        "userAddress": userAddress,
        "signature": signature
    }

    try:
        # Invoke the lockReward method on the contract
        lock_reward_invocation = wallet.invoke_contract(
            contract_address=CONTRACT_ADDRESS,
            abi=abi,
            method=method,
            args=lock_reward_args
        ).wait()
        print(lock_reward_invocation)

        # If the invocation is successful, add the reward to the database
        if lock_reward_invocation:
            success = add_reward(repositoryName, issueId, reward)
            if success:
                print(f"Successfully added reward for {repositoryName} issue {issueId}")

                # --- Post GitHub Issue Comment Section (after add_reward) ---
                try:
                    # Extract repository owner and name
                    repo_owner, repo_name = extract_repo_info(repositoryName)
                    # Extract transaction hash URL from the invocation result
                    tx_url = extract_transaction_hash(str(lock_reward_invocation))
                    # Format the comment with reward amount and extracted transaction hash URL
                    comment_body = format_reward_comment(reward, tx_url)
                    post_data = {"body": comment_body}
                    # Construct the URL for posting a comment to the issue
                    request_url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/issues/{issueId}/comments"
                    post_github_comment(request_url, post_data)
                    print(f"Posted comment to issue #{issueId} in {repositoryName}")
                except Exception as ex:
                    print(f"Failed to post comment: {str(ex)}")
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
        description="This tool allows the agent to lock rewards in the smart contract. "
                    "Please provide the repository name in the format 'owner/repository' (e.g. 'naizo01/agentic').",
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
