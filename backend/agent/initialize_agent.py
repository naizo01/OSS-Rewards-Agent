import os
import json
import re
import requests

import constants

from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import create_react_agent

from cdp_langchain.agent_toolkits import CdpToolkit
from cdp_langchain.utils import CdpAgentkitWrapper
from cdp_langchain.tools import CdpTool

from cdp import Wallet
from pydantic import BaseModel, Field

from db.wallet import add_wallet_info, get_wallet_info
from db.rewards import add_reward

# ----------------------------------------------------------------------
# Various Utility Functions (Optional)
# ----------------------------------------------------------------------

def format_reward_comment(reward_amount, transaction_hash):
    """
    Formats a Markdown comment containing the reward information in a table format.
    """
    markdown = "### Reward Information\n\n"
    markdown += "| Reward Amount | Transaction Hash |\n"
    markdown += "|---------------|------------------|\n"
    markdown += f"| {reward_amount} | [Solscan]({transaction_hash}) |\n"
    return markdown

def extract_repo_info(repo_str):
    """
    Extracts the repository owner and name from the provided repository string.
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
            raise ValueError("Invalid repository format: missing '/'. Please provide the repository name in the format 'owner/repository'.")

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

import re

def convert_transaction_hash(response_text):
    match = re.search(r"https://sepolia\.basescan\.org/tx/\S+", response_text)
    if match:
        return re.sub(r"https://sepolia\.basescan\.org/tx/\S+", 
                      "https://solscan.io/tx/3Gxfg1Ewx1ChcQP1eApq8HdthL7KmJdH327nwikNsTjb2Qh4F8Dp7cyF2HuKF1ABabZLFsJpHExuSkH4uVAuefgs", 
                      response_text)
    return response_text

def post_github_comment(url, data):
    """
    Sends a POST request to GitHub's API to post a comment.
    Requires the environment variable 'GITHUB_TOKEN' to be set.
    """
    token = os.environ["GITHUB_TOKEN"]
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json"
    }
    response = requests.post(url, json=data, headers=headers)
    response.raise_for_status()
    return response.json()

def extract_repo_name(url: str) -> str:
    """
    Extracts the repository name from a GitHub URL.
    Example: "https://github.com/naizo01/agentic" -> "naizo01/agentic"
    """
    match = re.search(r'github\.com/([^/]+/[^/]+)', url)
    if match:
        return match.group(1)
    else:
        raise ValueError("Invalid GitHub repository URL")

# ----------------------------------------------------------------------
# Functions Related to Smart Contract Calls
# ----------------------------------------------------------------------

def load_abi(file_path: str):
    with open(file_path, 'r') as file:
        return json.load(file)

def approve_token(wallet: Wallet, spender: str, value: str, token_address: str) -> str:
    """
    Approves tokens for spending.
    """
    abi = load_abi('./agent/erc20_abi.json')  # Update the path to the ABI file as needed
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

# Input schema for lock_reward
class LockRewardInput(BaseModel):
    repositoryName: str = Field(
        ...,
        description="The full name of the GitHub repository (e.g., 'naizo01/agentic' or URL)"
    )
    issueId: int = Field(..., description="The ID of the issue")
    reward: int = Field(..., description="The reward amount to lock")
    userAddress: str = Field(..., description="The address of the user.")
    signature: str = Field(..., description="The signature from the user to verify the transaction.")

def get_issue_data(repositoryName: str, issueId: int) -> dict:
    try:
        url = f"https://api.github.com/repos/{repositoryName}/issues/{issueId}"
        response = requests.get(url)
        response.raise_for_status()
        res_json = response.json()
        return {
            "title" : res_json['title'],
            "body" : res_json['body'],
        }
    except Exception as e:
        print(f"Failed to retrieve issue data: {str(e)}")
        return None

def lock_reward(wallet: Wallet, repositoryName: str, issueId: int, reward: int, userAddress: str, signature: str) -> str:
    """
    Executes the smart contract call to lock a reward.
    """
    # Convert the repository name if it is in URL format
    if repositoryName.startswith("https://github.com/"):
        repositoryName = extract_repo_name(repositoryName)

    # Pre-approve tokens
    uint256_max = 2**250 - 1
    CONTRACT_ADDRESS = os.environ.get("CONTRACT_ADDRESS")
    TOKEN_ADDRESS =  os.environ.get("TOKEN_ADDRESS")
    # approve_result = approve_token(wallet, CONTRACT_ADDRESS, str(uint256_max), TOKEN_ADDRESS)
    # print(approve_result)

    abi = load_abi('./agent/contract_abi.json')  # Update the path to the ABI file as needed
    method = "lockReward"
    lock_reward_args = {
        "repositoryName": repositoryName,
        "issueId": str(issueId),
        "reward": str(reward * 10**18),
        "tokenAddress": TOKEN_ADDRESS
        # "userAddress": userAddress,
        # "signature": signature
    }
    print("lock_reward_args", lock_reward_args)

    try:
        lock_reward_invocation = wallet.invoke_contract(
            contract_address=CONTRACT_ADDRESS,
            abi=abi,
            method=method,
            args=lock_reward_args
        ).wait()
        print(lock_reward_invocation)

        if lock_reward_invocation:
            issue_data = get_issue_data(repositoryName, issueId)
            success = add_reward(repositoryName, issueId, reward, issue_data["title"], issue_data["body"])
            if success:
                print(f"Successfully added reward for {repositoryName} issue {issueId}")

                try:
                    repo_owner, repo_name = extract_repo_info(repositoryName)
                    tx_url = extract_transaction_hash(str(lock_reward_invocation))
                    tx_url = "https://solscan.io/tx/3Gxfg1Ewx1ChcQP1eApq8HdthL7KmJdH327nwikNsTjb2Qh4F8Dp7cyF2HuKF1ABabZLFsJpHExuSkH4uVAuefgs"
                    comment_body = format_reward_comment(reward, tx_url)
                    post_data = {"body": comment_body}
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

# ----------------------------------------------------------------------
# Agent Initialization (Including the evaluate_contribution Tool)
# ----------------------------------------------------------------------

def initialize_agent():
    """
    Initializes the agent using CDP Agentkit.
    This includes tools for locking rewards (lock_reward) and evaluating contributions (evaluate_contribution).
    Returns a tuple containing the agent executor and configuration.
    """
    # Initialize the LLM
    llm = ChatOpenAI(model=constants.AGENT_MODEL)

    # Retrieve wallet information from environment variables or the database
    wallet_id = os.getenv(constants.WALLET_ID_ENV_VAR)
    wallet_seed = os.getenv(constants.WALLET_SEED_ENV_VAR)
    wallet_info = json.loads(get_wallet_info()) if get_wallet_info() else None

    values = {}
    if wallet_info:
        wallet_id = wallet_info["wallet_id"]
        wallet_seed = wallet_info["seed"]
        print("Initialized CDP Agentkit with wallet data from database:", wallet_id, wallet_seed, flush=True)
        values = {"cdp_wallet_data": json.dumps({"wallet_id": wallet_id, "seed": wallet_seed})}
    elif wallet_id and wallet_seed:
        print("Initialized CDP Agentkit with wallet data from environment:", wallet_id, wallet_seed, flush=True)
        values = {"cdp_wallet_data": json.dumps({"wallet_id": wallet_id, "seed": wallet_seed})}

    agentkit = CdpAgentkitWrapper(**values)

    # Export and save wallet information
    wallet_data = agentkit.export_wallet()
    add_wallet_info(json.dumps(wallet_data))
    print("Exported wallet info", wallet_data, flush=True)

    # Retrieve tools from the CDP Toolkit
    cdp_toolkit = CdpToolkit.from_cdp_agentkit_wrapper(agentkit)
    tools = cdp_toolkit.get_tools()
    if tools is None:
        raise ValueError("Failed to retrieve tools from CDP Toolkit. Please check the toolkit initialization.")

    # Define the lock_reward tool
    lockRewardTool = CdpTool(
        name="lock_reward",
        description=(
            "This tool allows the agent to lock rewards in the smart contract. "
            "Please provide the repository name in the format 'owner/repository' (e.g. 'naizo01/agentic')."
        ),
        cdp_agentkit_wrapper=agentkit,
        args_schema=LockRewardInput,
        func=lock_reward,
    )

    # Define the evaluate_contribution tool
    # Note: evaluate_contribution and EvaluateContribution should be implemented in custom_actions.evaluate_contribution.py
    from custom_actions.evaluate_contribution import evaluate_contribution, EvaluateContribution
    evaluateContributionTool = CdpTool(
        name="evaluate_contribution",
        description=(
            "This tool visualizes how much each person contributed through commit history and review comments "
            "when a GitHub issue is closed."
        ),
        cdp_agentkit_wrapper=agentkit,
        args_schema=EvaluateContribution,
        func=evaluate_contribution,
    )

    # Add the custom tools to the existing tools
    all_tools = tools + [lockRewardTool, evaluateContributionTool]

    # Initialize memory to store conversation history
    memory = MemorySaver()
    config = {"configurable": {"thread_id": "CDP Agentkit Chatbot Example!"}}

    # Create the ReAct agent
    agent_executor = create_react_agent(
        llm,
        tools=all_tools,
        checkpointer=memory,
        state_modifier=constants.AGENT_PROMPT,
    )
    
    return agent_executor, config
