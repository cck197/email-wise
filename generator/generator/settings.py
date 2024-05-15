from generator.db import get_db
from generator.klaviyo import db_import_from_klaviyo


async def email_settings_hook(settings):
    print(f"email settings changed: {settings=}")
    provider_map = {"Klaviyo": db_import_from_klaviyo}
    db = await get_db()
    try:
        func = provider_map[settings["emailProvider"]["name"]]
        await func(db, settings["shop"], api_key=settings["emailKey"])
    except KeyError:
        print(f"provider not found: {settings=}")


async def llm_settings_hook(settings):
    pass


async def async_save_settings_hook(old, new):
    if old["emailKey"] != new["emailKey"]:
        await email_settings_hook(new)
    if old["lLMKey"] != new["lLMKey"]:
        await llm_settings_hook(new)
