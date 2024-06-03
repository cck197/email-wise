import asyncio

from dotenv import load_dotenv

load_dotenv("../.env")

from generator.db import connect, get_client


async def init_from_list(l, model):
    db = get_client()
    await getattr(db, model).create_many(
        data=[{"name": item} for item in l], skip_duplicates=True
    )


async def init_tone():
    await init_from_list(
        [
            "Formal",
            "Assertive",
            "Informative",
            "Friendly",
            "Entertaining",
            "Neutral",
            "Uplifting",
        ],
        "tone",
    )


async def init_email_provider():
    await init_from_list(["Klaviyo"], "emailprovider")


async def init_llm_provider():
    await init_from_list(["OpenAI", "Groq", "Anthropic"], "llmprovider")


async def run():
    await connect()
    await asyncio.gather(init_tone(), init_email_provider(), init_llm_provider())


if __name__ == "__main__":
    asyncio.run(run())
