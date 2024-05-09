from dotenv import load_dotenv

load_dotenv("../.env")

from quart import Quart, request

from generator.db import get_db
from generator.email_generator import generate_email, get_email_generator

app = Quart(__name__)


@app.post("/webhook")
async def webhook():
    db = await get_db()
    data = await request.get_json()
    print(f"{data=}")
    email_generator = await get_email_generator(db, int(data["data"]["id"]))
    await generate_email(db, email_generator, data["data"]["productDescription"])
    return {"status": "success"}


def run() -> None:
    app.run()
