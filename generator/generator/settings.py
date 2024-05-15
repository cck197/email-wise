async def email_settings_hook(settings):
    print(f"email settings changed: {settings=}")


async def llm_settings_hook(settings):
    pass


async def async_save_settings_hook(old, new):
    if old["emailKey"] != new["emailKey"]:
        await email_settings_hook(new)
    if old["lLMKey"] != new["lLMKey"]:
        await llm_settings_hook(new)
