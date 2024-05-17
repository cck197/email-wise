import json

from klaviyo_api import KlaviyoAPI
from openapi_client import ApiException


class KlaviyoClient(object):
    def __init__(self, api_key):
        self.klaviyo = KlaviyoAPI(api_key)

    def create_template(self, name, html, text):
        body = {
            "data": {
                "type": "template",
                "attributes": {
                    "name": name,
                    "editor_type": "CODE",
                    "html": html,
                    "text": text,
                },
            }
        }
        return self.klaviyo.Templates.create_template(body)

    @classmethod
    def get_template_id(cls, template):
        return template["data"]["id"]

    def get_list_id_by_name(self, name):
        lists = self.klaviyo.Lists.get_lists(filter=f"equals(name,'{name}')")
        return lists["data"][0]["id"]

    def create_campaign(
        self, name, list_id, preview_text, subject, from_email, from_label
    ):
        body = {
            "data": {
                "type": "campaign",
                "attributes": {
                    "name": name,
                    "audiences": {
                        "included": [list_id],
                        "send_strategy": "immediate",
                    },
                    "campaign-messages": {
                        "data": [
                            {
                                "type": "campaign-message",
                                "attributes": {
                                    "channel": "email",
                                    "label": name,
                                    "content": {
                                        "subject": subject,
                                        "preview_text": preview_text,
                                        "from_email": from_email,
                                        "from_label": from_label,
                                        "reply_to_email": from_email,
                                    },
                                    "render_options": {
                                        "shorten_links": True,
                                        "add_org_prefix": True,
                                        "add_info_link": True,
                                        "add_opt_out_language": False,
                                    },
                                },
                            }
                        ]
                    },
                },
            }
        }
        return self.klaviyo.Campaigns.create_campaign(body)

    @classmethod
    def get_campaign_id(cls, campaign):
        return campaign["data"]["relationships"]["campaign-messages"]["data"][0]["id"]

    def assign_campaign_template(self, campaign_id, template_id):
        body = {
            "data": {
                "type": "campaign-message",
                "id": campaign_id,
                "relationships": {
                    "template": {"data": {"type": "template", "id": template_id}}
                },
            }
        }
        return self.klaviyo.Campaigns.create_campaign_message_assign_template(body)

    def get_templates(self):
        templates = self.klaviyo.Templates.get_templates(sort="-created")
        return [t["attributes"] for t in templates["data"]]


async def klaviyo_import_from_db(
    db,
    from_email="store@my-company.com",
    from_label="My Company",
    list_name="Sample Data List",
    take=10,
    api_key=None,
):
    emails = await db.email.find_many(
        order={
            "createdAt": "desc",
        },
        where={
            "emailGeneratorId": None,
        },
        take=take,
    )
    klaviyo = KlaviyoClient(api_key)
    list_id = klaviyo.get_list_id_by_name(list_name)
    for email in emails:
        print(f"processing email: {email.name}")
        template = klaviyo.create_template(email.name, email.html, email.text)
        campaign = klaviyo.create_campaign(
            email.name,
            list_id,
            email.text[:100],
            email.name,
            from_email,
            from_label,
        )
        campaign_id = klaviyo.get_campaign_id(campaign)
        template_id = klaviyo.get_template_id(template)
        klaviyo.assign_campaign_template(campaign_id, template_id)


async def db_import_from_klaviyo(db, shop, api_key=None):
    klaviyo = KlaviyoClient(api_key)
    try:
        templates = klaviyo.get_templates()
    except ApiException as e:
        data = json.loads(e.body)
        error_msg = data["errors"][0]["detail"].lower().replace(".", "")
        return {"error": f"Error importing from Klaviyo: {error_msg}"}
    for template in templates:
        print(f"processing template: {template['name']}")
        await db.email.create(
            data={
                "name": template["name"],
                "html": template["html"],
                "text": template["text"],
                "shop": shop,
                "createdAt": template["created"],
            }
        )
    n = len(templates)
    s = "" if n == 1 else "s"
    return {"success": f"Successfully imported {n} template{s} from Klaviyo"}
