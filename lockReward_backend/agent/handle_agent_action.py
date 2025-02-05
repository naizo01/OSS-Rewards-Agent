import constants
import re
from db.rewards import add_reward

def handle_agent_action(agent_action, content):
    """
    Handles the agent action.
    In our sample app, we add rewards to the database.
    """
    if agent_action == constants.EVENT_TYPE_TOOLS:
        # Parse content to extract repository_name, issue_id, and reward_amount
        try:
            match = re.search(r'Repository: (.*), Issue: (\d+), Reward: (\d+)', content)
            if match:
                repository_name = match.group(1).strip()
                issue_id = int(match.group(2))
                reward_amount = int(match.group(3))
                success = add_reward(repository_name, issue_id, reward_amount)
                if success:
                    print(f"Successfully added reward for {repository_name} issue {issue_id}")
                else:
                    print(f"Failed to add reward for {repository_name} issue {issue_id}")
            else:
                print("Failed to parse content for reward details.")
        except Exception as e:
            print(f"Error processing agent action: {str(e)}")