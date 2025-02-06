import sqlite3
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def setup():
    """
    Initialize database with proper table schemas including primary keys
    and appropriate constraints.
    """
    try:
        with sqlite3.connect("agent.db") as con:
            cur = con.cursor()
            
            # Wallet table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS wallet(
                    id INTEGER PRIMARY KEY,
                    info TEXT
                )
            """)
            
            # Rewards table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS rewards(
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    repository_name TEXT NOT NULL,
                    issue_id INTEGER NOT NULL,
                    reward_amount INTEGER NOT NULL,
                    UNIQUE(repository_name, issue_id)
                )
            """)
            
            con.commit()
            logger.info("Database tables created successfully")
    except sqlite3.Error as e:
        logger.error(f"Failed to setup database: {str(e)}")
        raise

def initialize_rewards_table():
    """
    Initialize only the rewards table.
    """
    try:
        with sqlite3.connect("agent.db") as con:
            cur = con.cursor()
            
            # Drop the existing rewards table if it exists
            cur.execute("DROP TABLE IF EXISTS rewards")
            
            # Create the rewards table
            cur.execute("""
                CREATE TABLE rewards(
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    repository_name TEXT NOT NULL,
                    issue_id INTEGER NOT NULL,
                    reward_amount INTEGER NOT NULL,
                    UNIQUE(repository_name, issue_id)
                )
            """)
            
            con.commit()
            logger.info("Rewards table initialized successfully")
    except sqlite3.Error as e:
        logger.error(f"Failed to initialize rewards table: {str(e)}")
        raise