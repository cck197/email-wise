from generator.db import get_db
from generator.klaviyo import db_import_from_klaviyo
from generator.openai import check_api_key


async def email_settings_hook(settings):
    print(f"email settings changed: {settings=}")
    provider_map = {"Klaviyo": db_import_from_klaviyo}
    db = await get_db()
    provider_name = settings["emailProvider"]["name"]
    func = provider_map.get(provider_name)
    if func is None:
        raise Exception(f"Email provider {provider_name} not found")
    return await func(db, settings["shop"], api_key=settings["emailKey"])


async def llm_settings_hook(settings):
    return check_api_key(settings["lLMKey"])


async def async_save_settings_hook(old, new):
    result = {}
    if old["emailKey"] != new["emailKey"]:
        result["emailKey"] = await email_settings_hook(new)
    if old["lLMKey"] != new["lLMKey"]:
        result["lLMKey"] = await llm_settings_hook(new)
    print(f"settings saved: {result=}")
    return result
