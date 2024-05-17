from dotenv import load_dotenv

load_dotenv("../.env")

import asyncio
import json

from quart import Quart, abort, current_app, make_response, request
from quart_cors import cors

from generator.db import get_db
from generator.email_generator import generate_email, get_email_generator, save_email

app = Quart(__name__)
# TODO change allow_origin to the domain of the frontend
app = cors(app, allow_origin="*")

from dataclasses import dataclass

SSE_HEADERS = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Transfer-Encoding": "chunked",
}


def check_sse_mimetypes(request):
    if "text/event-stream" not in request.accept_mimetypes:
        abort(400)


def check_sse_mimetypes(f):
    async def decorated_function(*args, **kwargs):
        if "text/event-stream" not in request.accept_mimetypes:
            current_app.logger.info("Unsupported MIME type for SSE")
            abort(400)
        return await f(*args, **kwargs)

    return decorated_function


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


async def send_email_events(id):
    db = await get_db()
    email_generator = await get_email_generator(db, int(id))
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
        yield get_encoded_event({"event": "end"})
    except asyncio.CancelledError:
        # client has disconnected, perform cleanup here
        print("client disconnected")


@check_sse_mimetypes
@app.get("/sse/email/<id>")
async def sse_email(id):
    response = await make_response(send_email_events(id), SSE_HEADERS)
    response.timeout = None
    return response


def run():
    app.run()
