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

# ログの設定
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')

# 環境変数からデフォルトの GitHub リポジトリ情報を取得（リポジトリ情報が単一の名前の場合に利用）
GITHUB_OWNER = os.environ.get('GITHUB_OWNER', 'default_owner')
# ポーリング間隔（秒）
POLL_INTERVAL = int(os.environ.get('POLL_INTERVAL', '120'))

# ---------------------------
# 各 reward エントリの対象 Issue を監視する関数
# ---------------------------
def monitor_specific_issue(socketio, agent_executor, config, owner, repo, issue_number, reward_value):
    """
    GitHub の特定 Issue（issue_number）を定期的にポーリングし、
    Issue がクローズされたタイミングで process_issue_event を呼び出す。
    """
    logging.info(f"Starting monitoring for issue #{issue_number} in {owner}/{repo}")
    processed = False

    while not processed:
        try:
            # 指定 Issue の API エンドポイントへアクセス
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

            # Issue がクローズされている場合、一度だけ処理する
            logging.info(f"Issue #{issue_number} in {owner}/{repo} has been closed at {closed_at}. Processing event...")
            issue_info = {
                'owner': owner,
                'repository': repo,
                'number': issue_number,
                'title': issue.get('title', ''),
                'user': issue.get('user', {}).get('login', ''),
                'closed_at': closed_at,
                'body': issue.get('body', ''),
                # reward_value やその他必要な情報も付与可能
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
# reward JSON から各 reward エントリを取得し、監視スレッドを起動する関数
# ---------------------------
def start_monitors(socketio, agent_executor, config):
    """
    reward サーバ (http://localhost:5001/reward) から JSON を取得し、
    各エントリのリポジトリ情報と Issue 番号に基づき個別スレッドで監視を開始する。
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
            # リポジトリ情報の形式に応じてパースする
            if repo_str.startswith("https://"):
                # URL 形式の場合、パス部分から "owner/repository" を抽出
                parsed = urlparse(repo_str)
                path = parsed.path.strip("/")
                if "/" in path:
                    owner, repo = path.split("/", 1)
                else:
                    logging.error(f"Invalid repository format from URL: {repo_str}")
                    continue
            elif "/" in repo_str:
                # "owner/repository" 形式
                owner, repo = repo_str.split("/", 1)
            else:
                # 単一のリポジトリ名の場合、デフォルトの owner を利用
                owner = GITHUB_OWNER
                repo = repo_str

            # reward の対象 Issue を監視するスレッドを起動
            t = threading.Thread(
                target=monitor_specific_issue,
                args=(socketio, agent_executor, config, owner, repo, issue_id, reward_value),
                daemon=True
            )
            t.start()
            logging.info(f"Started monitoring thread for {owner}/{repo} Issue #{issue_id}")
    except Exception as e:
        logging.error(f"Failed to start monitors: {e}")
