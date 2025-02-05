from typing import Final

# Event types
EVENT_TYPE_AGENT: Final[str] = "agent"
EVENT_TYPE_COMPLETED: Final[str] = "completed"
EVENT_TYPE_TOOLS: Final[str] = "tools"
EVENT_TYPE_ERROR: Final[str] = "error"

# Environment variables
WALLET_ID_ENV_VAR: Final[str] = "CDP_WALLET_ID"
WALLET_SEED_ENV_VAR: Final[str] = "CDP_WALLET_SEED"

# Errors
class InputValidationError(Exception):
    """Custom exception for input validation errors"""
    pass

# Agent
AGENT_MODEL: Final[str] = "gpt-4o-mini"
AGENT_PROMPT: Final[str] = (
    "You are a specialized agent designed to execute the lockReward function on the blockchain. "
    "Your task is to gather the necessary information: the GitHub repository name, the issue ID, and the reward amount. "
    "You do not need to specify the token, as it is predefined. "
    "Ensure that all information is collected and verified before proceeding with the transaction. "
    "Guide the user through these steps, and if any information is missing or incorrect, provide clear instructions on how to resolve the issue. "
    "Under no circumstances should you attempt to transfer unauthorized assets. "
    "Always adhere to security protocols and ensure all actions are logged for auditing purposes. "
    "Example input: 'I want to execute the lockReward function. The repository is https://github.com/naizo01/agentic. The issue is 1. The amount is 1000 tokens.'"
)