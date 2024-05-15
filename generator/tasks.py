import asyncio
import os

import dotenv

dotenv.load_dotenv("../.env")


from celery import Celery

from generator.settings import async_save_settings_hook

broker_url = os.environ["BROKER_URL"]

app = Celery("tasks", broker=broker_url, backend=broker_url)
app.config_from_object("celeryconfig")


@app.task
def add(x, y):
    return x + y


@app.task
def save_settings_hook(old, new):
    print(f"{old=} {new=}")
    loop = asyncio.get_event_loop()
    result = loop.run_until_complete(async_save_settings_hook(old, new))
    return result
