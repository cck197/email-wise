from openai import AuthenticationError, OpenAI


class OpenAIClient(object):
    def __init__(self, api_key):
        self.client = OpenAI(api_key=api_key)

    def list_models(self):
        return self.client.models.list()


def check_api_key(api_key):
    client = OpenAIClient(api_key)
    try:
        client.list_models()
        return {
            "success": "AI Integration settings successfully saved",
        }
    except AuthenticationError as e:
        error_msg = e.body["message"][:-1]
        error_msg = error_msg[0].lower() + error_msg[1:]
        return {"error": f"OpenAI: {error_msg}"}
