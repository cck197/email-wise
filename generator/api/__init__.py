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


async def send_time_events():
    while True:
        try:
            data = json.dumps({"time": asyncio.get_event_loop().time()})
            event = ServerSentEvent(data)
            yield event.encode()
            await asyncio.sleep(1)
        except asyncio.CancelledError:
            # client has disconnected, perform cleanup here
            print("client disconnected")
            break


RANDOM_STRING = """
Are You Tired of Sacrificing Nutrition for Convenience?

Let's face it, we've all been there - stuck in a rut, relying on the same old boring protein sources, sacrificing nutrition for the sake of convenience. But what if I told you there's a better way? A way to get the nutrients your body craves, without sacrificing flavor or convenience?

The Consequences of a Nutritionally Bankrupt Diet

We've all heard the horror stories - chronic fatigue, brain fog, and a weakened immune system, all thanks to a diet lacking in essential nutrients. And let's be honest, who hasn't fallen prey to the convenience of processed foods, only to pay the price later? But what if you could have your cake and eat it too? What if you could indulge in a juicy burger, knowing you're feeding your body the good stuff?

A Personal Story of Transformation

I remember the day I discovered the power of organ meats. I was struggling to get the nutrients I needed, and my energy levels were at an all-time low. But then I stumbled upon the secret to unlocking optimal health - grass-fed, grass-finished beef, blended with the nutrient-dense power of bison liver and heart. It was like a switch had been flipped, and suddenly I had the energy and vitality I had been missing.

The Transformation You've Been Waiting For

Imagine sinking your teeth into a juicy burger, knowing you're feeding your body the nutrients it craves. Imagine the energy, the vitality, and the confidence that comes with knowing you're giving your body the best. Our Ground Organ Meat Blends are the key to unlocking this transformation. Made with 100% grass-fed, grass-finished beef, blended with 7% bison liver and 3% bison heart, this is the ultimate game-changer for anyone looking to upgrade their nutrition.

Get Ready to Experience the Power of Organ Meats

Our Ground Beef and Bison Organ Blend is more than just a product - it's a movement. It's a declaration of independence from the processed food industry, and a commitment to feeding your body the nutrients it deserves. And the best part? It's ridiculously easy to incorporate into your daily routine. Simply substitute our blend into your favorite recipes, and get ready to experience the transformative power of organ meats.

So What Are You Waiting For?

Don't let another day go by, stuck in a rut of nutritional mediocrity. Take the first step towards optimal health, and try our Ground Organ Meat Blends today. Order now, and get ready to experience the energy, vitality, and confidence that comes with feeding your body the best.
"""


async def send_string_events():
    try:
        for string in RANDOM_STRING.split(" "):
            data = json.dumps({"message": string + " "})
            event = ServerSentEvent(data)
            yield event.encode()
            await asyncio.sleep(0.1)
        data = json.dumps({"event": "end"})
        event = ServerSentEvent(data)
        yield event.encode()
    except asyncio.CancelledError:
        # client has disconnected, perform cleanup here
        print("client disconnected")


@app.get("/sse")
async def sse():
    if "text/event-stream" not in request.accept_mimetypes:
        abort(400)

    response = await make_response(
        send_string_events(),
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
