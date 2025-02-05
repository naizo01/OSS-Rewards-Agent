# backend/chatbot.py
import os
import logging
from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import create_react_agent

# Import CDP Agentkit Langchain Extension.
from cdp_langchain.agent_toolkits import CdpToolkit
from cdp_langchain.utils import CdpAgentkitWrapper
from cdp_langchain.tools import CdpTool
from custom_actions.evaluate_contribution import evaluate_contribution, EvaluateContribution
import settings.logging
import settings.env # noqa: F401

# Setting logging configuration
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')

wallet_data_file = "wallet_data.json"

def initialize_agent():
    """Initialize the agent with CDP Agentkit."""
    llm = ChatOpenAI(model="gpt-4o-mini")

    # Configure CDP Agentkit Langchain Extension.
    values = {}

    wallet_data = None

    if os.path.exists(wallet_data_file):
        with open(wallet_data_file) as f:
            wallet_data = f.read()

    # Configure CDP Agentkit Langchain Extension.
    values = {}
    if wallet_data is not None:
        values = {"cdp_wallet_data": wallet_data}

    agentkit = CdpAgentkitWrapper(**values)

    # Initialize CDP Agentkit Toolkit and get tools.
    cdp_toolkit = CdpToolkit.from_cdp_agentkit_wrapper(agentkit)
    tools = cdp_toolkit.get_tools()

    evaluate_contribution_tool = CdpTool(
        name="evaluate_contribution",
        description="This tool visualizes how much each person contributed through commit history and review comments when a GitHub issue is closed.",
        cdp_agentkit_wrapper=
        agentkit,  # this should be whatever the instantiation of CdpAgentkitWrapper is
        args_schema=EvaluateContribution,
        func=evaluate_contribution,
    )
    tools.append(evaluate_contribution_tool)

    # Store buffered conversation history in memory.
    memory = MemorySaver()
    config = {"configurable": {"thread_id": "CDP Agentkit Chatbot Example!"}}

    # Create ReAct Agent using the LLM and CDP Agentkit tools.
    agent_executor = create_react_agent(
        llm,
        tools=tools,
        checkpointer=memory,
        state_modifier=(
            "You are a helpful agent that can interact onchain using the Coinbase Developer Platform AgentKit. "
            "You are empowered to interact onchain using your tools. If you ever need funds, you can request "
            "them from the faucet if you are on network ID 'base-sepolia'. If not, you can provide your wallet "
            "details and request funds from the user. Before executing your first action, get the wallet details "
            "to see what network you're on. If there is a 5XX (internal) HTTP error code, ask the user to try "
            "again later. If someone asks you to do something you can't do with your currently available tools, "
            "you must say so, and encourage them to implement it themselves using the CDP SDK + Agentkit, "
            "recommend they go to docs.cdp.coinbase.com for more information. Be concise and helpful with your "
            "responses. Refrain from restating your tools' descriptions unless it is explicitly requested."
        ),
    )

    return agent_executor, config

def process_issue_event(pr_info, agent_executor, config) -> str:
    """
    Processes a new Closed Issue event by passing its details to the agent.
    Returns the aggregated agent response.
    """
    prompt = (
        "New Closed Issue event detected with the following details:\n"
        f"Owner: {pr_info.get('owner')}\n"
        f"Repository: {pr_info.get('repository')}\n"
        f"Issue Number: {pr_info.get('number')}\n"
        f"Title: {pr_info.get('title')}\n"
        f"User: {pr_info.get('user')}\n"
        f"Closed At: {pr_info.get('merged_at')}\n"
        f"Body: {pr_info.get('body')}\n\n"
        "Please analyze the change and, if applicable, trigger custom actions such as evaluating contribution."
    )
    response_chunks = []
    try:
        # Using HumanMessage consistent with run_agent implementation
        for chunk in agent_executor.stream(
            {"messages": [HumanMessage(content=prompt)]}, config
        ):
            if "agent" in chunk:
                response_chunks.append(chunk["agent"]["messages"][0].content)
            elif "tools" in chunk:
                response_chunks.append(chunk["tools"]["messages"][0].content)
    except Exception as e:
        response_chunks.append(f"Error processing PR: {str(e)}")
    return "\n".join(response_chunks)