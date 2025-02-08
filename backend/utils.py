import json

def format_sse(data: str, event: str = None, functions: str = []) -> str:
    """Format data as SSE"""
    response = {
        "event": event,
        "data": data
    }
    if (len(functions) > 0):
        response["functions"] = functions
    return json.dumps(response) + "\n"