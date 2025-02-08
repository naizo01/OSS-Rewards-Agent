import sqlite3
from typing import List, Tuple
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add_reward(repository_name: str, issue_id: int, reward_amount: int, issue_title: str, issue_body: str) -> bool:
    """
    Add a reward to the database.
    If the reward already exists, add the reward_amount to the existing amount.
    Returns True if successful, False otherwise.
    """
    try:
        with sqlite3.connect("agent.db") as con:
            cur = con.cursor()
            
            # Check if the reward already exists
            cur.execute("""
                SELECT reward_amount FROM rewards
                WHERE repository_name = ? AND issue_id = ?
            """, (repository_name, issue_id))
            row = cur.fetchone()
            
            if row:
                # If exists, update the reward_amount
                new_amount = row[0] + reward_amount
                cur.execute("""
                    UPDATE rewards
                    SET reward_amount = ?
                    WHERE repository_name = ? AND issue_id = ?
                """, (new_amount, repository_name, issue_id))
            else:
                # If not exists, insert the new reward
                cur.execute("""
                    INSERT INTO rewards(repository_name, issue_id, reward_amount)
                    VALUES (?, ?, ?)
                """, (repository_name, issue_id, reward_amount))
            
            con.commit()
            
            # Verify the insertion or update
            if cur.rowcount > 0:
                logger.info(f"Successfully added or updated reward for {repository_name} issue {issue_id}")
                return True
            else:
                logger.warning(f"No rows were affected for reward: {repository_name} issue {issue_id}")
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
            cur.execute("SELECT repository_name, issue_id, reward_amount, id, is_merged, issue_title, issue_body FROM rewards")
            results = cur.fetchall()

            return results
            
    except sqlite3.Error as e:
        logger.error(f"Failed to retrieve rewards: {str(e)}")
        return []
    except Exception as e:
        logger.error(f"Unexpected error while retrieving rewards: {str(e)}")
        return [] 
    
def mark_reward_as_merged(repository_name: str, issue_id: int) -> bool:
    """
    Update is_merged to 1 for the specified repository and issue.
    """
    try:
        with sqlite3.connect("agent.db") as con:
            cur = con.cursor()
            cur.execute(
                """
                UPDATE rewards
                SET is_merged = 1
                WHERE repository_name = ? AND issue_id = ?
                """,
                (repository_name, issue_id)
            )
            con.commit()

            if cur.rowcount > 0:
                logger.info(f"Marked is_merged=1 for {repository_name} issue {issue_id}")
                return True
            else:
                logger.warning(f"No matching record found for {repository_name} issue {issue_id}")
                return False
    except sqlite3.Error as e:
        logger.error(f"Failed to update is_merged for {repository_name} issue {issue_id}: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return False

def get_reward_id(repository_name: str, issue_id: int) -> int | None:
    """
    Retrieve the 'id' for the specified repository_name and issue_id.
    Returns None if not found or in case of error.
    """
    try:
        with sqlite3.connect("agent.db") as con:
            cur = con.cursor()
            cur.execute(
                """
                SELECT id FROM rewards
                WHERE repository_name = ? AND issue_id = ?
                """,
                (repository_name, issue_id)
            )
            row = cur.fetchone()
            if row:
                return row[0]
            else:
                logger.warning(f"No matching record found for {repository_name} issue {issue_id}")
                return None
    except sqlite3.Error as e:
        logger.error(f"Database error occurred while retrieving id: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return None