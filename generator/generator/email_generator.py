import os
import random

import redis
from langchain.globals import set_llm_cache
from langchain_anthropic import ChatAnthropic
from langchain_community.cache import RedisCache
from langchain_core.prompts import ChatPromptTemplate, PromptTemplate
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI

from .prompts import (
    AUTHORS,
    AVOID_EXTRA_CRUFT,
    BRAND_PROMPT,
    KNOBS,
    SALES_PROMPT,
    SPECIALS_PROMPT,
    STORIES_PROMPT,
    STYLE,
    STYLE_ATTRS,
    STYLE_PROMPT,
    SYSTEM_PROMPT,
    TONE_PROMPT,
)
from .settings import get_settings

GROQ_MODEL_NAME = os.environ.get("GROQ_MODEL_NAME", "llama3-70b-8192")
OPENAI_MODEL_NAME = os.environ.get("OPENAI_MODEL_NAME", "gpt-4o")
ANTHROPIC_MODEL_NAME = os.environ.get("ANTHROPIC_MODEL_NAME", "claude-3-opus-20240229")
TEMPERATURE = os.environ.get("TEMPERATURE", 0.7)
ALLOW_NO_LLM_PROVIDER = os.environ.get("ALLOW_NO_LLM_PROVIDER", "true") == "true"

set_llm_cache(RedisCache(redis_=redis.from_url(os.environ["BROKER_URL"]), ttl=3600))

default_chat = ChatGroq(temperature=TEMPERATURE, model_name=GROQ_MODEL_NAME)


def get_random_author():
    authors = AUTHORS.split("/")
    return random.choice(authors).strip()


def get_knob(name):
    (p, t) = KNOBS[name]
    return t if random.random() > p else ""


def get_chat(settings):
    if ALLOW_NO_LLM_PROVIDER and (settings is None or not settings.lLMKey):
        return default_chat
    kwargs = {"api_key": settings.lLMKey, "temperature": TEMPERATURE}
    chat_map = {
        "Groq": ChatGroq(model_name=GROQ_MODEL_NAME, **kwargs),
        "OpenAI": ChatOpenAI(model_name=OPENAI_MODEL_NAME, **kwargs),
        "Anthropic": ChatAnthropic(model_name=ANTHROPIC_MODEL_NAME, **kwargs),
    }
    return chat_map.get(settings.lLMProvider.name, default_chat)


def get_brand(settings):
    return settings.brand if settings else None


async def get_email_generator(db, id):
    return await db.emailgenerator.find_first(where={"id": id}, include={"tone": True})


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


def get_email_style(email, chat=default_chat):
    cleaned_email = clean_email(email, chat).content
    system = f"""{STYLE} {AVOID_EXTRA_CRUFT}"""
    prompt = ChatPromptTemplate.from_messages([("system", system), ("human", "{text}")])
    chain = prompt | chat
    return chain.invoke({"text": f"```{cleaned_email}```\n{STYLE_ATTRS}"})


def get_product_copy_chain(
    style, brand, prod_desc, specials, stories, tone, likeness, chat=default_chat
):
    author = get_random_author()
    prompt = ChatPromptTemplate.from_messages(
        [("system", SYSTEM_PROMPT.format(author=author)), ("human", "{text}")]
    )
    chain = prompt | chat

    brand = (
        PromptTemplate.from_template(BRAND_PROMPT).format(brand=brand) if brand else ""
    )

    style = (
        PromptTemplate.from_template(STYLE_PROMPT).format(
            likeness=likeness, style=style
        )
        if style
        else ""
    )

    specials = (
        PromptTemplate.from_template(SPECIALS_PROMPT).format(specials=specials)
        if specials
        else ""
    )

    stories = (
        PromptTemplate.from_template(STORIES_PROMPT).format(stories=stories)
        if stories
        else ""
    )

    tone = (
        PromptTemplate.from_template(TONE_PROMPT).format(tone=tone)
        if tone != "Neutral"
        else ""
    )

    return (
        chain,
        {
            "text": PromptTemplate.from_template(SALES_PROMPT).format(
                avoid_extra_cruft=AVOID_EXTRA_CRUFT,
                author=author,
                product_halfway=get_knob("PRODUCT_HALFWAY"),
                fictional_story=get_knob("FICTIONAL_STORY"),
                hide_the_ball=get_knob("HIDE_THE_BALL"),
                specials=specials,
                stories=stories,
                tone=tone,
                prod_desc=prod_desc,
                style=style,
                brand=brand,
            )
        },
    )


async def generate_email(db, email_generator):
    settings = await get_settings(db, email_generator.shop)
    chat = get_chat(settings)
    print(f"{chat=}")
    sample_email = await get_sample_email(db, email_generator.shop)
    style = get_email_style(sample_email, chat=chat).content if sample_email else ""
    return get_product_copy_chain(
        style,
        get_brand(settings),
        email_generator.productDescription,
        email_generator.specials,
        email_generator.stories,
        email_generator.tone.name if email_generator.tone else "Neutral",
        email_generator.likeness,
        chat=chat,
    )
