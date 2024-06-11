import asyncio
import json
from dataclasses import dataclass

from quart import Blueprint, make_response

from generator.db import get_client
from generator.email_generator import generate_email, get_email_generator, save_email

sse_bp = Blueprint("see", __name__)

SSE_HEADERS = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Transfer-Encoding": "chunked",
}


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


@sse_bp.get("/email/<int:generator_id>")
async def sse_email(generator_id):

    async def send_email_events():
        db = get_client()
        email_generator = await get_email_generator(db, generator_id)
        if email_generator is None:
            yield get_encoded_event(
                {"error": f"email generator {generator_id} not found"}
            )
            return
        try:
            (chain, input) = await generate_email(db, email_generator)
            chunks = []
            async for chunk in chain.astream(input):
                content = chunk.content
                chunks.append(content)
                yield get_encoded_event({"message": content})
            copy = "".join(chunks)
            print(f"done generating email")
            email = await save_email(
                db,
                copy,
                copy,
                email_generator,
            )
            # print(f"saved email: {email=}")
            yield get_encoded_event({"event": "end", "id": email.id})
        except asyncio.CancelledError:
            # client has disconnected, perform cleanup here
            print("client disconnected")
        except Exception as e:
            print(f"error generating email: {e}")
            yield get_encoded_event({"event": "error", "message": str(e)})

    response = await make_response(send_email_events(), SSE_HEADERS)
    response.timeout = None
    return response
