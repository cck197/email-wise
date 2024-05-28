import os

import redis
from langchain.globals import set_llm_cache
from langchain_anthropic import ChatAnthropic
from langchain_community.cache import RedisCache
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI

from .prompts import (
    AVOID_EXTRA_CRUFT,
    SALES_PROMPT,
    SALT_PROMPT,
    STYLE_ATTRS,
    SYSTEM_PROMPT,
    TONE,
    TONE_PROMPT,
)
from .settings import get_settings

GROQ_MODEL_NAME = os.environ.get("GROQ_MODEL_NAME", "llama3-70b-8192")
OPENAI_MODEL_NAME = os.environ.get("OPENAI_MODEL_NAME", "gpt-4o")
ANTHROPIC_MODEL_NAME = os.environ.get("ANTHROPIC_MODEL_NAME", "claude-3-opus-20240229")
TEMPERATURE = os.environ.get("TEMPERATURE", 0.7)

set_llm_cache(RedisCache(redis_=redis.from_url(os.environ["BROKER_URL"]), ttl=3600))

default_chat = ChatGroq(temperature=TEMPERATURE, model_name=GROQ_MODEL_NAME)


def get_chat(settings):
    kwargs = {"api_key": settings.lLMKey, "temperature": TEMPERATURE}
    chat_map = {
        "Groq": ChatGroq(model_name=GROQ_MODEL_NAME, **kwargs),
        "OpenAI": ChatOpenAI(model_name=OPENAI_MODEL_NAME, **kwargs),
        "Anthropic": ChatAnthropic(model_name=ANTHROPIC_MODEL_NAME, **kwargs),
    }
    return chat_map.get(settings.lLMProvider.name, default_chat)


async def get_email_generator(db, id):
    return await db.emailgenerator.find_first(where={"id": id})


async def save_email(db, name, html, text, email_generator):
    return await db.email.create(
        data={
            "shop": email_generator.shop,
            "emailGeneratorId": email_generator.id,
            "name": name,
            "html": html,
            "text": text,
        }
    )


async def get_sample_email(db, shop):
    return await db.email.find_first(
        order={
            "createdAt": "desc",
        },
        where={"shop": shop, "emailGeneratorId": None},
    )


def clean_email(email, chat=default_chat):
    system = f"""Your job is to return the text formatted nicely with no special
    characters or multiple spaces or blank lines. {AVOID_EXTRA_CRUFT}"""
    prompt = ChatPromptTemplate.from_messages([("system", system), ("human", "{text}")])
    chain = prompt | chat
    return chain.invoke({"text": email.text})


def get_email_tone(email, chat=default_chat):
    cleaned_email = clean_email(email, chat).content
    system = f"""{TONE} {AVOID_EXTRA_CRUFT}"""
    prompt = ChatPromptTemplate.from_messages([("system", system), ("human", "{text}")])
    chain = prompt | chat
    return chain.invoke({"text": f"```{cleaned_email}```\n{STYLE_ATTRS}"})


def get_product_copy_chain(tone, prod_desc, salt, likeness, chat=default_chat):
    prompt = ChatPromptTemplate.from_messages(
        [("system", SYSTEM_PROMPT), ("human", "{text}")]
    )
    chain = prompt | chat

    tone = (
        ChatPromptTemplate.from_template(TONE_PROMPT).format(
            likeness=likeness, tone=tone
        )
        if tone
        else ""
    )

    salt = (
        ChatPromptTemplate.from_template(SALT_PROMPT).format(salt=salt) if salt else ""
    )

    return (
        chain,
        {
            "text": ChatPromptTemplate.from_template(SALES_PROMPT).format(
                avoid_extra_cruft=AVOID_EXTRA_CRUFT,
                salt=salt,
                prod_desc=prod_desc,
                tone=tone,
            )
        },
    )


async def generate_email(db, email_generator):
    settings = await get_settings(db, email_generator.shop)
    chat = get_chat(settings)
    print(f"{chat=}")
    sample_email = await get_sample_email(db, email_generator.shop)
    tone = get_email_tone(sample_email, chat=chat).content if sample_email else ""
    return get_product_copy_chain(
        tone,
        email_generator.productDescription,
        email_generator.salt,
        email_generator.likeness,
        chat=chat,
    )
