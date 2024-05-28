import os
from urllib.parse import urlparse

from dotenv import load_dotenv

load_dotenv("../.env")

import asyncio
import json

from quart import Quart, abort, current_app, make_response, request
from quart_cors import cors

from generator.db import connect, get_client
from generator.email_generator import generate_email, get_email_generator, save_email

app = Quart(__name__)

from dataclasses import dataclass

SSE_HEADERS = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Transfer-Encoding": "chunked",
}

SHOPIFY_APP_URL = os.environ["SHOPIFY_APP_URL"]


def get_cors_pattern():
    parsed_url = urlparse(SHOPIFY_APP_URL)
    domain = parsed_url.netloc
    cors_pattern = (
        rf"^(https?://{domain.replace('.', r'\.')}|http://localhost(:[0-9]+)?)$"
    )
    print(f"{cors_pattern=}")


# Initialize the Quart app and apply CORS settings
# app = cors(app, allow_origin="*")  # get_cors_pattern())


app = cors(app, allow_origin="*")


@app.before_serving
async def connect_to_db():
    await connect()


@app.after_serving
async def disconnect_from_db():
    await get_client().disconnect()


@dataclass
class ServerSentEvent:
    data: str
    event: str | None = None
    id: int | None = None
    retry: int | None = None

    def encode(self) -> bytes:
        message = f"data: {self.data}"
        if self.event is not None:
            message = f"{message}\nevent: {self.event}"
        if self.id is not None:
            message = f"{message}\nid: {self.id}"
        if self.retry is not None:
            message = f"{message}\nretry: {self.retry}"
        message = f"{message}\r\n\r\n"
        return message.encode("utf-8")


def get_encoded_event(data):
    print(f"{data=}")
    return ServerSentEvent(json.dumps(data)).encode()


@app.get("/sse/email/<id>")
async def sse_email(id):

    async def send_email_events():
        db = get_client()
        email_generator = await get_email_generator(db, int(id))
        if email_generator is None:
            yield get_encoded_event({"error": f"email generator {id} not found"})
            return
        (chain, input) = await generate_email(db, email_generator)
        try:
            chunks = []
            async for chunk in chain.astream(input):
                content = chunk.content
                chunks.append(content)
                yield get_encoded_event({"message": content})
            copy = "".join(chunks)
            name = copy.split("\n")[0]
            print(f"done generating email: {name=}")
            email = await save_email(
                db,
                name,
                copy,
                copy,
                email_generator,
            )
            # print(f"saved email: {email=}")
            yield get_encoded_event({"event": "end", "id": email.id})
        except asyncio.CancelledError:
            # client has disconnected, perform cleanup here
            print("client disconnected")

    response = await make_response(send_email_events(), SSE_HEADERS)
    response.timeout = None
    return response


def run():
    app.run(debug=True)
