# backend/websocket_module.py
import time
import requests
import os
import logging
from datetime import datetime, timezone
import settings.logging
import settings.env # noqa: F401

from chatbot import process_issue_event

# ログの設定
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')

# 環境変数から GitHub リポジトリ情報を取得
GITHUB_OWNER = os.environ.get('GITHUB_OWNER', 'default_owner')
GITHUB_REPO = os.environ.get('GITHUB_REPO', 'default_repo')
LABEL_NAME = os.environ.get('LABEL_NAME', 'reward')
POLL_INTERVAL = int(os.environ.get('POLL_INTERVAL', '120'))

# すでに処理済みの Issue の ID を保持するセット
processed_issue_ids = set()

def fetch_reward_issues():
    """
    GitHub API を利用して、指定されたラベルが付与されたクローズ済みの Issue を取得する
    """
    url = f'https://api.github.com/repos/{GITHUB_OWNER}/{GITHUB_REPO}/issues'
    params = {'state': 'closed', 'per_page': 100}
    try:
        response = requests.get(url, params=params)
        logging.info(f"GitHub API response status: {response.status_code}")
        if response.status_code != 200:
            logging.error(f"GitHub API error: {response.status_code} - {response.text}")
            return []
        issues = response.json()
        # Issues API は PR も含むため、pull_request キーが存在するものは除外する
        issues = [issue for issue in issues if 'pull_request' not in issue]
        # 指定されたラベルが含まれる Issue のみを抽出する
        filtered_issues = [
            issue for issue in issues
            if any(label['name'] == LABEL_NAME for label in issue.get('labels', []))
        ]
        logging.info(f"Number of Issues after filtering: {len(filtered_issues)}")
        return filtered_issues
    except Exception as e:
        logging.error(f"An exception occurred during the GitHub API request: {e}")
        return []

def monitor_github_issues(socketio, agent_executor, config):
    """
    定期的に GitHub の Issue を監視し、前回のポーリング以降にクローズされた Issue を検出する
    """
    logging.info("Starting GitHub Issue monitoring")
    # 初回ポーリング時のタイムスタンプを記録
    last_poll_time = datetime.now(timezone.utc)

    while True:
        try:
            logging.info("Fetching issues from the GitHub API...")
            issues = fetch_reward_issues()
            logging.info(f"Number of retrieved issues: {len(issues)}")
            
            for issue in issues:
                try:
                    issue_number = issue['number']
                    closed_at = issue.get('closed_at')
                    if not closed_at:
                        continue

                    # ISO 8601 形式の文字列を UTC の datetime オブジェクトに変換
                    closed_time = datetime.fromisoformat(closed_at.replace("Z", "+00:00"))

                    # 前回のポーリング時以降にクローズされた Issue のみを処理する
                    if closed_time <= last_poll_time:
                        continue

                    # すでに処理済みの場合はスキップする
                    if issue_number in processed_issue_ids:
                        continue

                    processed_issue_ids.add(issue_number)
                    issue_info = {
                        'owner': GITHUB_OWNER,
                        'repository': GITHUB_REPO,
                        'number': issue_number,
                        'title': issue['title'],
                        'user': issue['user']['login'],
                        'closed_at': closed_at,
                        'body': issue.get('body', '')
                    }
                    logging.info(f"Issue closed detected: #{issue_number} - {issue['title']}")

                    # ※ process_issue_event を利用する場合は以下のようにする
                    agent_response = process_issue_event(issue_info, agent_executor, config)
                    socketio.emit('issue_processed', {'issue_info': issue_info, 'agent_response': agent_response})
                    
                    # ここではシンプルに Issue 情報だけを送信
                    # socketio.emit('issue_processed', {'issue_info': issue_info})
                except Exception as e:
                    logging.error(f"Error processing issue #{issue.get('number')}: {e}")

            # ポーリング完了後、last_poll_time を更新する
            last_poll_time = datetime.now(timezone.utc)
            logging.info(f"Waiting {POLL_INTERVAL} seconds until the next polling.\n{'-'*50}")
            time.sleep(POLL_INTERVAL)
        except Exception as e:
            # 全体の例外発生時にも last_poll_time を更新する
            last_poll_time = datetime.now(timezone.utc)
            logging.error(f"An error occurred while monitoring: {e}")
            logging.info(f"Waiting {POLL_INTERVAL} seconds until the next polling.\n{'-'*50}")
            time.sleep(POLL_INTERVAL)
