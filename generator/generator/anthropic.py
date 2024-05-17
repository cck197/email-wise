from anthropic import Anthropic, AuthenticationError


class AnthropicClient(object):
    def __init__(self, api_key):
        self.client = Anthropic(api_key=api_key)

    def list_models(self):
        # Anthropic does not have a list models endpoint
        self.client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=1024,
            messages=[{"role": "user", "content": "Hello, Claude"}],
        )


def check_api_key(api_key):
    client = AnthropicClient(api_key)
    try:
        client.list_models()
        return {"success": True}
    except AuthenticationError as e:
        error_msg = e.body["error"]["message"]
        return {"error": f"Anthropic: {error_msg}"}
