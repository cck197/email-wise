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


from langchain_anthropic import ChatAnthropic
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

model_name = "claude-3-opus-20240229"
model = ChatAnthropic(model_name=model_name)


def get_chain():
    prompt = ChatPromptTemplate.from_template("tell me a joke about {topic}")
    parser = StrOutputParser()
    return prompt | model | parser


async def send_string_events(topic):
    chain = get_chain()
    try:
        async for chunk in chain.astream({"topic": topic}):
            yield get_encoded_event({"message": chunk})
        yield get_encoded_event({"event": "end"})
    except asyncio.CancelledError:
        # client has disconnected, perform cleanup here
        print("client disconnected")


async def send_email_events(id):
    db = await get_db()
    chain = get_chain()
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
@app.get("/sse/joke/<topic>")
async def sse_joke(topic):
    response = await make_response(send_string_events(topic), SSE_HEADERS)
    response.timeout = None
    return response


@check_sse_mimetypes
@app.get("/sse/email/<id>")
async def sse_email(id):
    response = await make_response(send_email_events(id), SSE_HEADERS)
    response.timeout = None
    return response


# @app.post("/webhook")
# async def webhook():
#     db = await get_db()
#     data = await request.get_json()
#     print(f"{data=}")
#     email_generator = await get_email_generator(db, int(data["data"]["id"]))
#     await generate_email(db, email_generator, data["data"]["productDescription"])
#     return {"status": "success"}


def run():
    app.run()
