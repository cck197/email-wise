from dotenv import load_dotenv

load_dotenv("../../.env")

from generator.db import get_db
from generator.klaviyo import (
    assign_campaign_template,
    create_campaign,
    create_template,
    get_campaign_id,
    get_list_id_by_name,
    get_template_id,
)


async def klaviyo_import_from_db(
    from_email="store@my-company.com",
    from_label="My Company",
    list_name="Sample Data List",
    take=10,
):
    db = await get_db()
    emails = await db.email.find_many(
        order={
            "createdAt": "desc",
        },
        where={
            "emailGeneratorId": None,
        },
        take=take,
    )
    list_id = get_list_id_by_name(list_name)
    for email in emails:
        print(f"processing email: {email.name}")
        template = create_template(email.name, email.html, email.text)
        campaign = create_campaign(
            email.name,
            list_id,
            email.text[:100],
            email.name,
            from_email,
            from_label,
        )
        campaign_id = get_campaign_id(campaign)
        template_id = get_template_id(template)
        assign_campaign_template(campaign_id, template_id)
