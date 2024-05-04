from dotenv import load_dotenv

load_dotenv("../.env")

from quart import Quart, request

from generator.db import get_db
from generator.email_generator import get_email_generator

app = Quart(__name__)


@app.post("/webhook")
async def webhook():
    db = await get_db()
    data = await request.get_json()
    email_generator = await get_email_generator(db, int(data["id"]))
    print(f"{email_generator=}")
    return {"status": "success"}


def run() -> None:
    app.run()
