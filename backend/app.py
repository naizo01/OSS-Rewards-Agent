# backend/app.py
import os
from flask import Flask, request, Response
from flask_socketio import SocketIO
from langchain_core.messages import HumanMessage
import json

# Initialize the AI agent using the chatbot モジュール
from chatbot import initialize_agent
# reward JSON の各エントリから対象 Issue を監視する start_monitors を利用
from websocket_module import start_monitors

app = Flask(__name__)

# Initialize Flask-SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize the AI agent globally
agent_executor, config = initialize_agent()

# ルートエンドポイント: ブラウザで http://localhost:5001 にアクセスすると 'websocket server' を表示
@app.route("/")
def index():
    return "websocket server"

@app.route("/api/chat", methods=["POST"])
def api_chat():
    """
    ユーザからのメッセージを受信し、AI エージェントのレスポンスを返すエンドポイント
    リクエストボディに {"message": "ユーザ入力"} を送信する
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

    # Flask のデバッグモード（リローダー）では、このブロックが 2 回実行されるため、
    # 環境変数 "WERKZEUG_RUN_MAIN" が "true" になっているプロセスのみで start_monitors を呼ぶ
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        start_monitors(socketio, agent_executor, config)

    socketio.run(app, host="0.0.0.0", port=5002, debug=True)
