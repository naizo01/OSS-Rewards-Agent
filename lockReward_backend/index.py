from flask import Flask, request, Response, stream_with_context, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from agent.initialize_agent import initialize_agent
from agent.run_agent import run_agent
from db.setup import setup
from db.rewards import get_rewards  # Import the get_rewards function

load_dotenv()
app = Flask(__name__)

# Allow CORS for http://localhost:3000 with all methods
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
CORS(app, resources={r"/*": {"origins": "http://localhost:3001"}})
CORS(app, resources={r"/*": {"origins": "http://localhost:3002"}})

# Setup SQLite tables
setup()

# Initialize the agent
agent_executor = initialize_agent()
app.agent_executor = agent_executor

# Interact with the agent
@app.route("/api/chat", methods=['POST'])
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

# Retrieve a list of rewards
@app.route("/rewards", methods=['GET'])
def rewards():
    try:
        rewards = get_rewards()
        return jsonify({'rewards': rewards}), 200
    except Exception as e:
        app.logger.error(f"Unexpected error in rewards endpoint: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
    