from dotenv import load_dotenv

load_dotenv("../../.env")

from generator.db import connect, get_client
from generator.klaviyo import db_import_from_klaviyo, klaviyo_import_from_db


async def import_from_db(**kwargs):
    return await klaviyo_import_from_db(get_client(), **kwargs)


async def db_import(shop):
    return await db_import_from_klaviyo(get_client(), shop)


if __name__ == "__main__":
    db = connect()
