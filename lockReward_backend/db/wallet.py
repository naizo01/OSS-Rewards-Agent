import sqlite3
from typing import Optional
import logging
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add_wallet_info(info: str) -> None:
    """
    Add or update wallet information in the database.
    """
    try:
        with sqlite3.connect("agent.db") as con:
            cur = con.cursor()
            
            # Check if wallet info exists
            cur.execute("SELECT id FROM wallet")
            existing = cur.fetchone()
            
            if existing:
                # Update existing wallet info
                cur.execute("UPDATE wallet SET info = ? WHERE id = ?", (info, existing[0]))
            else:
                # Insert new wallet info
                cur.execute("INSERT INTO wallet(info) VALUES (?)", (info,))
            
            con.commit()
            
            if cur.rowcount > 0:
                logger.info("Successfully saved wallet info")
            else:
                logger.warning("No changes made to wallet info")
                
    except sqlite3.Error as e:
        logger.error(f"Database error occurred: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error occurred: {str(e)}")

def get_wallet_info() -> Optional[str]:
    """
    Retrieve wallet information from the database.
    """
    try:
        with sqlite3.connect("agent.db") as con:
            cur = con.cursor()
            cur.execute("SELECT info FROM wallet")
            result = cur.fetchone()
            
            if result:
                return json.loads(result[0])
            else:
                return None
                
    except sqlite3.Error as e:
        logger.error(f"Failed to retrieve wallet info: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error while retrieving wallet info: {str(e)}")
        return None