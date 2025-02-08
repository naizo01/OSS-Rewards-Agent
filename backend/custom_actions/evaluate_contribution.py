import json
import sys
import requests
import os
from typing import List
from db.rewards import mark_reward_as_merged, get_reward_id
from pydantic import BaseModel, Field

from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI
from cdp import Wallet
import settings.logging  # noqa: F401
import settings.env  # noqa: F401
import logging

CONTRACT_ADDRESS = os.environ.get("CONTRACT_ADDRESS")
GITHUB_API_URL = os.environ.get("GITHUB_API_URL")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
CONTRACT_ABI_PATH = './abi/contract_abi.json'

HEADERS = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json"
}

def load_abi(file_path: str) -> dict | None:
    """Load the ABI from a JSON file.

    Args:
        file_path (str): The path to the JSON file.

    Returns:
        dict | None: The ABI as a dictionary or None if an error occurred.
    """
    abs_path = os.path.abspath(file_path)
    if not os.path.exists(abs_path):
        logging.error(f"File not found: {abs_path}")
        return None
    try:
        with open(abs_path, 'r') as file:
            abi = json.load(file)
            return abi
    except json.JSONDecodeError as e:
        logging.error(f"Error decoding JSON in {abs_path}: {e}")
        return None
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        return None

def register_and_complete_issue(wallet: Wallet, repositoryName: str, issueId: str, githubIds: List[str], percentages: List[str]) -> str:
    """Register and complete issue in the smart contract.

    Args:
        wallet (Wallet): The wallet to use for the transaction.
        repositoryName (str): The name of the GitHub repository.
        issueId (int): The ID of the issue.
        githubIds (List[str]): The GitHub IDs of the contributors.
        percentages (List[int]): The contribution percentages of the contributors.

    Returns:
        str: The result of the contract invocation.
    """
    abi = load_abi(CONTRACT_ABI_PATH)
    register_and_complete_issue_args = {
        "repositoryName": repositoryName,
        "issueId": issueId,
        "githubIds": githubIds,
        "percentages": percentages
    }
    logging.info(f"Register and complete issue args: {register_and_complete_issue_args}")

    try:
        # Invoke the registerAndCompleteIssue method on the contract
        register_and_complete_issue_invocation = wallet.invoke_contract(
            contract_address=CONTRACT_ADDRESS,
            abi=abi,
            method="registerAndCompleteIssue",
            args=register_and_complete_issue_args
        ).wait()
        logging.info(f"Register and complete issue result: {register_and_complete_issue_invocation}")

        return f"Register and complete issue successfully: {register_and_complete_issue_invocation}"
    except Exception as e:
        logging.error(f"Failed to register and complete issue: {sys.exc_info()}")
        return f"Failed to register and complete issue: {str(e)}"

class EvaluateContribution(BaseModel):
    repo_owner: str = Field(
        ...,
        description=
        "GitHub Repository Owner",
        example="coinbase")
    
    repo_name: str = Field(
        ...,
        description=
        "GitHub Repository Name",
        example="agentkit")

    issue_number: int = Field(
        ...,
        description=
        "GitHub Repository Issue number",
        example=172)

    issue_title: str = Field(
        ...,
        description=
        "GitHub Repository Issue Title",
        example="Update README.md")

    issue_body: str = Field(
        ...,
        description=
        "GitHub Repository Issue Body",
        example="This is an example issue body")

def request_get_github_api(url: str) -> dict | None:
    """Execute the GitHub API using the GET method

    Args:
        url (str): The URL of the GitHub API

    Returns:
        dict | None: The response from the GitHub API
    """
    try:
        res = requests.get(f"{url}", headers=HEADERS)
        res.raise_for_status()
        return res.json()
    except Exception as e:
        logging.error(f"An exception occurred during the GitHub API request: {str(e)}")
        return None

def request_post_github_api(url: str, data: dict) -> dict | None:
    """Execute the GitHub API using the POST method

    Args:
        url (str): The URL of the GitHub API
        data (dict): The data to be sent to the GitHub API

    Returns:
        dict | None: The response from the GitHub API
    """
    try:
        res = requests.post(f"{url}", json=data, headers=HEADERS)
        res.raise_for_status()
        return res.json()
    except Exception as e:
        logging.error(f"An exception occurred during the GitHub API request: {str(e)}")
        return None

def extract_commit_info(commits: dict) -> List[dict]:
    """Extract necessary information from the commit history

    Args:
        commits (dict): The commit history raw data

    Returns:
        List[str]: The list of extracted commit information
    """
    commit_history = []
    for commit in commits:
        commit_info = {
            "name": commit["committer"]["login"],
            "commit_url": commit["url"],
            "change_files": []
        }

        # Retrieve commit details
        commit_detail = request_get_github_api(commit["url"])
        # Retrieve changed file names and modification details
        for file in commit_detail["files"]:
            commit_info["change_files"].append(
                {
                    "filename": file["filename"],
                    "patch": file["patch"]
                }
            )
        
        commit_history.append(commit_info)
    
    return commit_history

def extract_review_info(reviews: dict) -> List[dict]:
    """Extract necessary information from the review comments

    Args:
        reviews (dict): The review comments raw data

    Returns:
        List[str]: The list of extracted review information
    """
    review_comment_list = []
    for review in reviews:
        review_info = {
            "name": review["user"]["login"],
            "comment": review["body"]
        }
        review_comment_list.append(review_info)
    
    return review_comment_list

def extract_pull_request_url(data: List[dict]) -> List[str]:
    """Extract the pull request URL from the event data

    Args:
        data (list): The issue timeline data

    Returns:
        List[str]: The pull request URLs
    """
    urls = []
    for item in data:
        # Safely traverse nested dictionaries using .get with defaults
        pull_request = item.get("source", {}).get("issue", {}).get("pull_request", {})
        # Check if pull_request exists and merged_at field has a value
        merged_at = pull_request.get("merged_at")
        if merged_at:
            url = pull_request.get("url")
            if url:
                urls.append(url)
    return urls

def format_contribution_report(data: List[dict]) -> str:
    """Format the contribution report in markdown

    Args:
        data (list): The contribution data

    Returns:
        str: The formatted contribution report in markdown
    """
    # table header
    markdown = "### Contribution Report\n\n"
    markdown += "| GitHub Username | Contribution (%) | Reason |\n"
    markdown += "|----------------|-----------------|--------|\n"

    # table body
    for item in data:
        markdown += f"| {item['name']} | {item['contribution']} | {item['reason']} |\n"

    logging.info(f"Contribution Report: {markdown}")

    return markdown

def evaluate_contribution(
        wallet: Wallet,
        repo_owner: str,
        repo_name: str,
        issue_number: int,
        issue_title: str,
        issue_body: str
    ) -> str:
    """Evaluate the contribution of each contributor to a closed issue.

    Args:
        wallet (Wallet): The wallet to use for the transaction.
        repo_owner (str): The owner of the GitHub repository.
        repo_name (str): The name of the GitHub repository.
        issue_number (int): The number of the GitHub issue.
        issue_title (str): The title of the GitHub issue.
        issue_body (str): The body of the GitHub issue.

    Returns:
        str: The result of the contribution evaluation.
    """
    # Retrieve related pull request url
    timeline = request_get_github_api(f"{GITHUB_API_URL}/repos/{repo_owner}/{repo_name}/issues/{issue_number}/timeline")

    pull_request_urls = extract_pull_request_url(timeline)

    commit_history = []
    review_comment_list = []

    # Retrieve pull request information
    for pull_rq_url in pull_request_urls:
        pull_request_detail_res = request_get_github_api(pull_rq_url)

        if pull_request_detail_res is None:
            logging.error("GitHub API Error")
            return "GitHub API Error"

        # Retrieve pull request commit information
        commits_res = request_get_github_api(pull_request_detail_res["_links"]["commits"]["href"])
        # Retrieve the committer, committed files, and modification details
        commit_history.append(extract_commit_info(commits_res))

        # Retrieve pull request review comments
        reviews_res = request_get_github_api(pull_request_detail_res["_links"]["review_comments"]["href"])
        # Retrieve the reviewer and review comments.
        review_comment_list.append(extract_review_info(reviews_res))

    # Create prompto for LLM
    prompt = (
        "You are an agent that evaluates each contributor's impact on closing a GitHub Issue."
        "You analyze the source code committed by committers. "
        "You also review the comments provided by reviewers."
        "The information of the closed issue is as follows.\n\n"
        f"[Issue Title]\n{issue_title}\n\n"
        f"[Issue Body]\n{issue_body}\n\n"
        "The following is the commit history and review comments of a pull request related to the closed issue.\n\n"
        f"[Commit History]\n{commit_history}\n\n"
        f"[Review Comment]\n{review_comment_list}\n\n"
        "Based on the above information,"
        "analyze the contribution of each contributor (committer and reviewer) towards the completion of this closed issue,"
        "and calculate the percentage contribution of each, assuming the closed issue completion is 100%."
        "Provide as much detail as possible regarding the reasons for the assigned contribution percentages."
        "Include specifics on which parts of the code were modified and to what extent,"
        "as well as which review comments were particularly valuable."
        "The output format should be:\n"
        "[{name: github username, contribution: contribution percentage (%), reason: reason why you determined the contribution percentage (%)}, ...]\n"
        "No lead-in text is needed, so only display the JSON output result. The string ```json is also not required."
    )
    logging.info(f"Input for the LLM: {prompt}")

    # Query the LLM
    llm = ChatOpenAI(model="gpt-4o-mini")
    response = llm.invoke([HumanMessage(content=prompt)])
    logging.info(f"Response from the LLM: {response.content}")
    
    # Parse the response from the LLM
    contributer_to_distribution = json.loads(response.content)
    names = [item["name"] for item in contributer_to_distribution]
    contributions = [str(item["contribution"]) for item in contributer_to_distribution]
    # Execute registerAndCompleteIssue contract method
    register_and_complete_issue(wallet, f"{repo_owner}/{repo_name}", str(issue_number), names, contributions)

    # Comment to issue
    post_data = {
        "body": f"{format_contribution_report(contributer_to_distribution)}"
    }
    request_post_github_api(f"{GITHUB_API_URL}/repos/{repo_owner}/{repo_name}/issues/{issue_number}/comments", post_data)

    # Update is_merged = 1
    mark_reward_as_merged(f"{repo_owner}/{repo_name}", issue_number)

    # Retrieve reward ID
    updated_id = get_reward_id(f"{repo_owner}/{repo_name}", issue_number)
    logging.info(f"Updated reward ID: {updated_id}")

    # Mention contributors. Only mention contributors who have a positive contribution
    mention_names = []
    for item in contributer_to_distribution:
        if item["contribution"] > 0:
            mention_names.append(f"@{item['name']}")
   
    claim_domain = os.environ.get("CLAIM_DOMAIN", "http://localhost:3000/claim")
    mention_text = " ".join(mention_names) if mention_names else ""
    comment_text = f"{mention_text}\nYou can claim from the following URL.\n{claim_domain}?id={updated_id}\n"

    request_post_github_api(
        f"{GITHUB_API_URL}/repos/{repo_owner}/{repo_name}/issues/{issue_number}/comments",
        {"body": comment_text}
    )

    return "Contribution evaluation completed successfully."