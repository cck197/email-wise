import os

import redis
from langchain.globals import set_llm_cache
from langchain_anthropic import ChatAnthropic
from langchain_community.cache import RedisCache
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI

from .settings import get_settings

GROQ_MODEL_NAME = os.environ.get("GROQ_MODEL_NAME", "llama3-70b-8192")
OPENAI_MODEL_NAME = os.environ.get("OPENAI_MODEL_NAME", "gpt-4o")
ANTHROPIC_MODEL_NAME = os.environ.get("ANTHROPIC_MODEL_NAME", "claude-3-opus-20240229")
TEMPERATURE = os.environ.get("TEMPERATURE", 0.7)


SYSTEM_PROMPT = os.environ.get(
    "SYSTEM_PROMPT",
    "You are legendary copywriter Gary C Halbert.",
)

AVOID_EXTRA_CRUFT = os.environ.get(
    "AVOID_EXTRA_CRUFT",
    """Avoid starting your responses with 'Here is the' or 'Here's the'. No
    backticks. Provide the answer and nothing else.""",
)

STYLE_ATTRS = os.environ.get(
    "STYLE_ATTRS",
    """
- Tone: The attitude conveyed by the writer towards the subject or audience.
- Mood: The overall emotional atmosphere perceived by the reader.
- Pace: The speed at which the story or content progresses.
- Style: The distinctive way in which the author uses language and structure.
- Voice: The unique personality the writer brings to the text, distinct from other authors.
- Diction: The choice of words and their connotations, which influence the tone and readability.
- Syntax: The arrangement of words and phrases to create well-formed sentences, affecting clarity and pace.
- Imagery: The use of descriptive or figurative language to create vivid pictures in the reader's mind.
- Theme: The underlying message or main idea the writer wishes to convey.
- Perspective: The point of view from which the story is told, influencing how information is presented to the reader.
""",
)

COPY_INSTRUCTIONS = os.environ.get(
    "COPY_INSTRUCTIONS",
    """
Here is a non-exclusive list of truths you know about writing good email sales copy (this list is generally arranged in order of importance):

1. Urgency in Subject Lines: Adding words like "URGENT" or specifying deadlines can create a sense of urgency that encourages high open rates.
2. Personalization: Addressing the reader directly (e.g., using names) can increase engagement.
3. Clear Benefit in Subject Lines: Highlighting a clear benefit or potential gain (e.g., "Investment Jackpot") draws interest.
4. Curiosity in Subject Lines: Phrasing that evokes curiosity (e.g., "possible?") can entice readers to open the email.
5. Continuity Between Subject Line and Body: The email body should closely follow the promise or topic of the subject line to maintain reader interest and trust.
6. Conciseness: Both the subject line and email body should be concise and to the point, making it easy to digest.
7. Bold Statements: Using bold text for key points or offers (e.g., "But you need to get in before tomorrow!") draws attention to important information.
8. Clear Call to Action: Every email includes a clear call to action (e.g., "Click here for full details").
9. Repetition of Offers: Repeating the main offer or action multiple times ensures the message sticks.
10. Use of Testimonials and Authority: Mentioning credible sources or successful individuals (e.g., "Peter Thiel, Steve Huffman") adds legitimacy.
11. P.S. Statements: Including P.S. sections to reinforce the main offer or add extra information can be effective.
12. Free Offers: Promising something free (e.g., "Free Bottle of turmeric") can entice readers to click.
13. Limited-Time Offers: Emphasizing limited-time offers or scarcity (e.g., "only available to the first 500 people") creates urgency.
14. Emotional Appeal: Leveraging emotions, such as fear of missing out (FOMO), to drive action.
15. Imagery: Strategic use of images can break up text and make the email more visually appealing, though too many images can be distracting.
16. Links Placement: Placing links after key points ensures readers can easily find them when they are most interested.
17. Informative Yet Teasing: Providing enough information to be informative but leaving enough out to require the reader to click through for full details.
18. Strong Opening Lines: The first line of the email body should hook the reader and align with the subject line.
19. Multiple Links: Including multiple links (usually 2-3) to increase the chances of a click-through.
20. Consistent Voice: Maintaining a consistent voice that matches the brand and resonates with the audience.
21. Diction: Using persuasive and powerful words to emphasize benefits and urgency.
22. Engaging Tone: Using a conversational and engaging tone to build rapport with the reader.
23. Highlighting Key Points: Using bullet points or bold text to highlight key points and make them easily scannable.
24. Relatable Stories: Including personal or relatable stories to connect with the reader on an emotional level.
25. Action-Oriented Language: Using action-oriented language to encourage immediate response (e.g., "Learn more," "Get the full story").
26. Imagery for Emotional Impact: Placing images that evoke an emotional response at the beginning or middle of the email.
27. Visual Breaks: Using images and headings to create visual breaks in the text for better readability.
28. Credibility Building: Including quotes from reputable sources to build credibility.
29. Anticipating Questions: Addressing potential reader questions or concerns within the body text to preemptively answer doubts.
30. Encouraging Sharing: Phrases that encourage readers to share the information with others can extend the email's reach.
31. Exclusive Information: Framing the information as exclusive or insider knowledge increases perceived value.
32. Imagery Placement: Placing images near calls to action to draw attention to them.
33. Easy Navigation: Ensuring that the email is easy to navigate, with clear sections and not too dense with text.
34. Formatting for Mobile: Emails should be formatted to be easily readable on mobile devices, with short paragraphs and sufficient white space.
35. Consistency Across Emails: Maintaining a consistent format and style across different emails to build familiarity.
36. Highlighting Savings: Emphasizing any potential savings or discounts can attract cost-conscious readers.
37. Positive Outlook: A positive and optimistic outlook can make the reader feel good about engaging with the content.
38. Personal Stories: Sharing personal success stories or anecdotes can make the content more relatable.
39. Clear Formatting: Using clear formatting with headings, bullet points, and short paragraphs for readability.
40. Frequent Reminders: Including reminders of the offer or deadline throughout the email to keep it top of mind.
41. Engaging Questions: Starting with engaging questions to pique interest and encourage the reader to seek answers within the email.
42. Multimedia Use: Incorporating multimedia elements (e.g., images, banners) judiciously to enhance the message without overwhelming the reader.
43. Appeal to Common Interests: Referencing common interests or popular trends to build a connection with the reader.
44. Cross-Promotions: Including cross-promotions or additional offers that might interest the reader.
45. Link Descriptions: Descriptive links that clearly state what the reader will gain by clicking.
46. Empathy: Showing empathy towards the reader’s situation to build a connection and trust.
47. Teasing Future Content: Teasing future content or offers to keep readers engaged over the long term.
48. Addressing Pain Points: Directly addressing and offering solutions to common pain points experienced by the reader.
49. Interactive Elements: Occasionally including interactive elements (e.g., surveys, polls) to increase engagement.
50. Regular Updates: Providing regular updates or new information to keep the content fresh and relevant.

For this specific task, you're helping an e-commerce store owner write email copy that converts. 

Your first goal is to get readers to open the email, and your second goal is to get readers to click through from the email to the sales/product page. These two goals are primary, and everything else is secondary (e.g., "selling" the product).

Please start the email with a catchy subject line.

[You might, but are not required to, use the PASTOR method below:

'PASTOR' stands for problem, amplify, story, transformation, offer, response.

1.  Problem: Identify your audience's pain points and challenges.
2. Amplify: Amplify the consequences of not addressing the problem.
3. Story: Share a relatable story or example that illustrates the problem.
4. Transformation: Offer a solution that transforms the situation.
5. Offer: Present your product or service as the key to achieving the transformation.
6. Response: End with a clear call-to-action that encourages people to take the next step.
""",
)

SALT_INSTRUCTIONS = os.environ.get(
    "SALT_INSTRUCTIONS",
    """
Pay very close attention to the salt below delimited by triple backticks for
additional instruction. 
""",
)

TONE_INSTRUCTIONS = os.environ.get(
    "TONE_INSTRUCTIONS",
    "List the tone qualities for the text delimited by triple backticks below using the list.",
)

LIKENESS_INSTRUCTIONS = os.environ.get(
    "LIKENESS_INSTRUCTIONS",
    """
The email should have similar tone qualities to those listed below. 
The degree of likeness is a five point scale from 1 to 5:
1: Not at all
2: Very little
3: Somewhat
4: Quite a bit
5: Very much
""",
)

FINAL_PROMPT = os.environ.get(
    "FINAL_PROMPT",
    """
Write a brief (no more than 750 words) sales email for the product delimited by triple backticks below.
""",
)

set_llm_cache(RedisCache(redis_=redis.from_url(os.environ["BROKER_URL"]), ttl=3600))

default_chat = ChatGroq(temperature=TEMPERATURE, model_name=GROQ_MODEL_NAME)


def get_chat(settings):
    kwargs = {"api_key": settings.lLMKey}
    chat_map = {
        "Groq": ChatGroq(temperature=TEMPERATURE, model_name=GROQ_MODEL_NAME, **kwargs),
        "OpenAI": ChatOpenAI(
            temperature=TEMPERATURE, model_name=OPENAI_MODEL_NAME, **kwargs
        ),
        "Anthropic": ChatAnthropic(
            temperature=TEMPERATURE, model_name=ANTHROPIC_MODEL_NAME, **kwargs
        ),
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
    system = f"""{TONE_INSTRUCTIONS} {AVOID_EXTRA_CRUFT}"""
    prompt = ChatPromptTemplate.from_messages([("system", system), ("human", "{text}")])
    chain = prompt | chat
    return chain.invoke({"text": f"```{cleaned_email}```\n{STYLE_ATTRS}"})


def get_product_copy_chain(tone, prod_desc, salt, likeness, chat=default_chat):
    system = f"""{SYSTEM_PROMPT} {AVOID_EXTRA_CRUFT}"""
    prompt = ChatPromptTemplate.from_messages([("system", system), ("human", "{text}")])
    chain = prompt | chat

    return (
        chain,
        {
            "text": f"{COPY_INSTRUCTIONS}\n{FINAL_PROMPT}\n{AVOID_EXTRA_CRUFT}\n"
            f"{SALT_INSTRUCTIONS}\n\n%SALT%```{salt}```\n"
            f"%PROD%```{prod_desc}```\n"
            f"{LIKENESS_INSTRUCTIONS} %LIKENESS```{likeness}```\n{tone}"
        },
    )


async def generate_email(db, email_generator):
    settings = await get_settings(db, email_generator.shop)
    chat = get_chat(settings)
    print(f"{chat=}")
    sample_email = await get_sample_email(db, email_generator.shop)
    tone = get_email_tone(sample_email, chat=chat).content
    return get_product_copy_chain(
        tone,
        email_generator.productDescription,
        email_generator.salt,
        email_generator.likeness,
        chat=chat,
    )
