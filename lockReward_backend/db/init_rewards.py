import logging
from setup import initialize_rewards_table

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def initialize_rewards():
    """
    Initialize the rewards table in the database.
    """
    try:
        initialize_rewards_table()
        logger.info("Rewards table initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize rewards table: {str(e)}")

if __name__ == "__main__":
    initialize_rewards() 