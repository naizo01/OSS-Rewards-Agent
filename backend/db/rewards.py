import sqlite3
from typing import List, Tuple
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add_reward(repository_name: str, issue_id: int, reward_amount: int) -> bool:
    """
    Add a reward to the database.
    Returns True if successful, False otherwise.
    """
    try:
        with sqlite3.connect("agent.db") as con:
            cur = con.cursor()
            
            # Try to insert the reward
            cur.execute("""
                INSERT INTO rewards(repository_name, issue_id, reward_amount)
                VALUES (?, ?, ?)
            """, (repository_name, issue_id, reward_amount))
            con.commit()
            
            # Verify the insertion
            if cur.rowcount > 0:
                logger.info(f"Successfully added reward for {repository_name} issue {issue_id}")
                return True
            else:
                logger.warning(f"No rows were inserted for reward: {repository_name} issue {issue_id}")
                return False
                
    except sqlite3.IntegrityError as e:
        logger.error(f"Reward already exists or unique constraint failed: {str(e)}")
        return False
    except sqlite3.Error as e:
        logger.error(f"Database error occurred: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error occurred: {str(e)}")
        return False

def get_rewards() -> List[Tuple[str, int, int]]:
    """
    Retrieve all rewards from the database.
    Returns empty list if no rewards found or in case of error.
    """
    try:
        with sqlite3.connect("agent.db") as con:
            cur = con.cursor()
            cur.execute("SELECT repository_name, issue_id, reward_amount, id, is_merged FROM rewards")
            results = cur.fetchall()

            return results
            
    except sqlite3.Error as e:
        logger.error(f"Failed to retrieve rewards: {str(e)}")
        return []
    except Exception as e:
        logger.error(f"Unexpected error while retrieving rewards: {str(e)}")
        return [] 