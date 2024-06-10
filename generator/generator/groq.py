import os

from groq import AuthenticationError, Groq

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")


class GroqClient(object):
    def __init__(self, api_key):
        self.client = Groq(api_key=api_key if api_key else GROQ_API_KEY)

    def list_models(self):
        return self.client.models.list()


def check_api_key(api_key):
    client = GroqClient(api_key)
    try:
        client.list_models()
        return {"success": True}
    except AuthenticationError as e:
        error_msg = e.body["error"]["message"]
        error_msg = error_msg[0].lower() + error_msg[1:]
        return {"error": f"Groq: {error_msg}"}
