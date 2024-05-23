import importlib

from generator.db import get_client
from generator.klaviyo import db_import_from_klaviyo


async def email_settings_hook(settings):
    print(f"email settings changed: {settings=}")
    provider_map = {"Klaviyo": db_import_from_klaviyo}
    db = get_client()
    provider_name = settings["emailProvider"]["name"]
    func = provider_map.get(provider_name)
    if func is None:
        raise Exception(f"Email provider {provider_name} not found")
    return await func(db, settings["shop"], api_key=settings["emailKey"])


async def llm_settings_hook(settings):
    provider_name = settings["lLMProvider"]["name"].lower()
    module_name = f"generator.{provider_name}"
    module = importlib.import_module(module_name)
    return getattr(module, "check_api_key")(settings["lLMKey"])


async def save_settings_hook(old, new):
    result = {}
    if old["emailKey"] != new["emailKey"]:
        result["emailKey"] = await email_settings_hook(new)
    if old["lLMKey"] != new["lLMKey"]:
        result["lLMKey"] = await llm_settings_hook(new)
    print(f"settings saved: {result=}")
    return result


async def get_settings(db, shop):
    db = get_client()
    return await db.settings.find_first(
        where={"shop": shop}, include={"emailProvider": True, "lLMProvider": True}
    )
