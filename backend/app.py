# backend/app.py
import time
import os
from flask import Flask, request, Response, stream_with_context, jsonify
from flask_socketio import SocketIO
from langchain_core.messages import HumanMessage
import json

# Initialize the AI agent using the chatbot module
# from chatbot import initialize_agent
# Use start_monitors to monitor target issues from each entry in the rewards JSON
from websocket_module import start_monitors
from agent.initialize_agent import initialize_agent
from agent.run_agent import run_agent
from db.setup import setup
from db.rewards import get_rewards  # Import the get_rewards function
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)

# Allow CORS for http://localhost:3000, http://localhost:3001, and http://localhost:3002 with all methods
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
CORS(app, resources={r"/*": {"origins": "http://localhost:3001"}})
CORS(app, resources={r"/*": {"origins": "http://localhost:3002"}})

# Setup SQLite tables
setup()

# Initialize Flask-SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize the AI agent globally
agent_executor, config = initialize_agent()

# Root endpoint: When accessing http://localhost:5001 in a browser, "websocket server" is displayed
@app.route("/")
def index():
    return "websocket server"

@app.route("/api/chat", methods=["POST"])
def api_chat():
    """
    Endpoint that receives a message from the user and returns the AI agent's response.
    Send {"message": "user input"} in the request body.
    """
    data = request.get_json()
    if not data or "message" not in data:
        return Response(
            json.dumps({"error": "Missing 'message' in JSON body"}, ensure_ascii=False),
            status=400,
            mimetype='application/json; charset=utf-8'
        )

    user_input = data["message"]
    response_chunks = []
    try:
        for chunk in agent_executor.stream({"messages": [HumanMessage(content=user_input)]}, config):
            if "agent" in chunk:
                response_chunks.append(chunk["agent"]["messages"][0].content)
            elif "tools" in chunk:
                response_chunks.append(chunk["tools"]["messages"][0].content)
    except Exception as e:
        app.logger.error(f"An error occurred while communicating with the agent: {e}")
        return Response(
            json.dumps({"error": "Internal Server Error"}, ensure_ascii=False),
            status=500,
            mimetype='application/json; charset=utf-8'
        )

    final_response = "\n".join(response_chunks)
    return Response(
        json.dumps({"response": final_response}, ensure_ascii=False),
        mimetype='application/json; charset=utf-8'
    )

# Initialize the agent (again) and attach it to the app
agent_executor, config = initialize_agent()
app.agent_executor = agent_executor

# Interact with the agent
@app.route("/api/agent", methods=['POST'])
def chat():
    try:
        data = request.get_json()
        # Parse the user input from the request
        input = data['input']
        # Use the conversation_id passed in the request for conversation memory
        config = {"configurable": {"thread_id": data['conversation_id']}}
        return Response(
            stream_with_context(run_agent(input, app.agent_executor, config)),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Content-Type': 'text/event-stream',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no'
            }
        )
    except Exception as e:
        app.logger.error(f"Unexpected error in chat endpoint: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

@app.route("/rewards", methods=['GET'])
def rewards():
    try:
        rewards = get_rewards()
        return jsonify({'rewards': rewards}), 200
    except Exception as e:
        app.logger.error(f"Unexpected error in rewards endpoint: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

POLL_INTERVAL = int(os.environ.get('POLL_INTERVAL', '30'))
def periodically_start_monitors(socketio, agent_executor, config, check_interval=300):
    """
    Periodically retrieves rewards and starts monitoring threads if new rewards are found.
    check_interval is the time in seconds between each check.
    """
    while True:
        start_monitors(socketio, agent_executor, config)
        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    print("Starting Flask server...")

    # In Flask's debug mode (reloader), this block is executed twice.
    # Therefore, call start_monitors only in the process where the environment variable "WERKZEUG_RUN_MAIN" is "true".
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        import threading
        monitor_thread = threading.Thread(
            target=periodically_start_monitors,
            args=(socketio, agent_executor, config),
            daemon=True  # daemon=True ensures the thread exits when the main program does
        )
        monitor_thread.start()

    socketio.run(app, host="0.0.0.0", port=5001, debug=True)
