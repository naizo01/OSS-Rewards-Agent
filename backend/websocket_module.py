# backend/websocket_module.py
import time
import requests
import os
import logging
import threading
from datetime import datetime, timezone
from urllib.parse import urlparse

import settings.logging
import settings.env  # noqa: F401

from chatbot import process_issue_event

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')

# Retrieve the default GitHub repository owner from environment variables
# (used when only a repository name is provided)
GITHUB_OWNER = os.environ.get('GITHUB_OWNER', 'default_owner')
# Polling interval in seconds
POLL_INTERVAL = int(os.environ.get('POLL_INTERVAL', '120'))

# ---------------------------
# Function to monitor the specific issue for each reward entry
# ---------------------------
def monitor_specific_issue(socketio, agent_executor, config, owner, repo, issue_number, reward_value):
    """
    Periodically polls a specific GitHub issue (issue_number) in the given repository,
    and when the issue is closed, calls process_issue_event.
    """
    logging.info(f"Starting monitoring for issue #{issue_number} in {owner}/{repo}")
    processed = False

    while not processed:
        try:
            # Access the API endpoint for the specified issue
            url = f'https://api.github.com/repos/{owner}/{repo}/issues/{issue_number}'
            response = requests.get(url)
            logging.info(f"Fetching issue #{issue_number} from {owner}/{repo} - status: {response.status_code}")
            
            if response.status_code != 200:
                logging.error(f"GitHub API error for {owner}/{repo} Issue #{issue_number}: {response.status_code} - {response.text}")
                time.sleep(POLL_INTERVAL)
                continue

            issue = response.json()
            closed_at = issue.get('closed_at')
            if closed_at is None:
                logging.info(f"Issue #{issue_number} in {owner}/{repo} is not closed yet. Waiting {POLL_INTERVAL} seconds...")
                time.sleep(POLL_INTERVAL)
                continue

            # Once the issue is closed, process it only once
            logging.info(f"Issue #{issue_number} in {owner}/{repo} has been closed at {closed_at}. Processing event...")
            issue_info = {
                'owner': owner,
                'repository': repo,
                'number': issue_number,
                'title': issue.get('title', ''),
                'user': issue.get('user', {}).get('login', ''),
                'closed_at': closed_at,
                'body': issue.get('body', ''),
                # Additional information such as reward_value can also be added
                'reward_value': reward_value,
            }
            print(issue_info)
            agent_response = process_issue_event(issue_info, agent_executor, config)
            socketio.emit('issue_processed', {
                'issue_info': issue_info,
                'agent_response': agent_response
            })
            processed = True
            logging.info(f"Finished processing issue #{issue_number} in {owner}/{repo}. Exiting monitoring thread.")
        except Exception as e:
            logging.error(f"An error occurred while monitoring {owner}/{repo} Issue #{issue_number}: {e}")
            time.sleep(POLL_INTERVAL)

# ---------------------------
# Function to fetch the rewards JSON and start monitoring threads for each reward entry
# ---------------------------
def start_monitors(socketio, agent_executor, config):
    """
    Fetches the JSON from the reward server (http://localhost:5001/reward)
    and starts a monitoring thread for each reward entry based on the repository
    information and issue number.
    """
    rewards_url = "http://localhost:5001/rewards"
    try:
        response = requests.get(rewards_url)
        if response.status_code != 200:
            logging.error(f"Error fetching rewards: {response.status_code} - {response.text}")
            return
        rewards_json = response.json()
        rewards = rewards_json.get("rewards", [])
        logging.info(f"Number of rewards received: {len(rewards)}")

        for reward in rewards:
            if len(reward) < 2:
                logging.error(f"Invalid reward entry (expected at least 2 elements): {reward}")
                continue

            repo_str = reward[0]
            issue_id = reward[1]
            reward_value = reward[2] if len(reward) > 2 else None

            owner, repo = None, None
            # Parse the repository information based on its format
            if repo_str.startswith("https://"):
                # For URL format, extract the "owner/repository" from the path
                parsed = urlparse(repo_str)
                path = parsed.path.strip("/")
                if "/" in path:
                    owner, repo = path.split("/", 1)
                else:
                    logging.error(f"Invalid repository format from URL: {repo_str}")
                    continue
            elif "/" in repo_str:
                # For "owner/repository" format
                owner, repo = repo_str.split("/", 1)
            else:
                # If only a repository name is provided, use the default owner
                owner = GITHUB_OWNER
                repo = repo_str

            # Start a monitoring thread for the target issue of the reward entry
            t = threading.Thread(
                target=monitor_specific_issue,
                args=(socketio, agent_executor, config, owner, repo, issue_id, reward_value),
                daemon=True
            )
            t.start()
            logging.info(f"Started monitoring thread for {owner}/{repo} Issue #{issue_id}")
    except Exception as e:
        logging.error(f"Failed to start monitors: {e}")
