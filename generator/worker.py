import asyncio
import os
import signal

import dotenv

dotenv.load_dotenv("../.env")

from bullmq import Worker

from generator.db import connect, get_client
from generator.settings import save_settings_hook

QUEUE_NAME = os.environ["QUEUE_NAME"]
BROKER_URL = os.environ["BROKER_URL"]


async def process(job, job_token):
    print(f"processing {job.id}, {job_token=} with data {job.data}", flush=True)
    return await save_settings_hook(job.data["old"], job.data["new"])


async def main():
    await connect()
    worker = Worker(QUEUE_NAME, process, {"connection": BROKER_URL})
    print(f"worker started: {QUEUE_NAME=}", flush=True)

    stop_event = asyncio.Event()

    def handle_signal():
        print("received exit signal", flush=True)
        stop_event.set()

    loop = asyncio.get_running_loop()
    for sig in {signal.SIGINT, signal.SIGTERM}:
        loop.add_signal_handler(sig, handle_signal)

    await stop_event.wait()
    await worker.close()
    # close the connection to the database
    await get_client().disconnect()


def run():
    asyncio.run(main())


if __name__ == "__main__":
    run()
