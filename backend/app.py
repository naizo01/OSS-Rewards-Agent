# backend/app.py
from flask import Flask, request, Response
from flask_socketio import SocketIO
from langchain_core.messages import HumanMessage
import json

# Load the module using absolute import
from chatbot import initialize_agent
from websocket_module import monitor_github_issues

app = Flask(__name__)

# Initialize Flask-SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize the AI agent globally
agent_executor, config = initialize_agent()

# Add a root endpoint: When accessing http://localhost:5001 in a browser, it displays 'websocket server'.
@app.route("/")
def index():
    return "websocket server"

@app.route("/api/chat", methods=["POST"])
def api_chat():
    """
    An endpoint that receives a message from the user and returns the agent's response.
    Send a POST request with {"message": "user input"} in the request body.
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

if __name__ == "__main__":
    print("Starting Flask server...")

    monitor_github_issues(socketio, agent_executor, config)

    # Start the Flask-SocketIO server (host: 0.0.0.0, port: 5001)
    socketio.run(app, host="0.0.0.0", port=5001, debug=True)
