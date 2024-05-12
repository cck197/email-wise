from dotenv import load_dotenv

load_dotenv("../.env")

import asyncio
import json

from quart import Quart, abort, make_response, request
from quart_cors import cors

from generator.db import get_db
from generator.email_generator import generate_email, get_email_generator

app = Quart(__name__)
# TODO change allow_origin to the domain of the frontend
app = cors(app, allow_origin="*")

from dataclasses import dataclass


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


@app.get("/sse")
async def sse():
    if "text/event-stream" not in request.accept_mimetypes:
        abort(400)

    async def send_events():
        while True:
            try:
                data = json.dumps({"time": asyncio.get_event_loop().time()})
                event = ServerSentEvent(data)
                yield event.encode()
                await asyncio.sleep(5)
            except asyncio.CancelledError:
                # client has disconnected, perform cleanup here
                print("client disconnected")
                break

    response = await make_response(
        send_events(),
        {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Transfer-Encoding": "chunked",
        },
    )
    response.timeout = None
    return response


@app.post("/webhook")
async def webhook():
    db = await get_db()
    data = await request.get_json()
    print(f"{data=}")
    email_generator = await get_email_generator(db, int(data["data"]["id"]))
    await generate_email(db, email_generator, data["data"]["productDescription"])
    return {"status": "success"}


def run():
    app.run()
