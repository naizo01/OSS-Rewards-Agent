from typing import Iterator
from langchain_core.messages import HumanMessage
import constants
from utils import format_sse

def run_agent(input, agent_executor, config) -> Iterator[str]:
    """Run the agent and yield formatted SSE messages"""
    try:
        for chunk in agent_executor.stream(
            {"messages": [HumanMessage(content=input)]}, config
        ):
            if "agent" in chunk:
                content = chunk["agent"]["messages"][0].content
                if content:
                    yield format_sse(content, constants.EVENT_TYPE_AGENT)
    except Exception as e:
        yield format_sse(f"Error: {str(e)}", constants.EVENT_TYPE_ERROR)