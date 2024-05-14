import os

from klaviyo_api import KlaviyoAPI

api_key = os.environ.get("KLAVIYO_API_KEY")
klaviyo = KlaviyoAPI(api_key) if api_key else None


# set the Klaviyo client using an API key passed as argument
def set_klaviyo_client(api_key):
    global klaviyo
    klaviyo = KlaviyoAPI(api_key)


def create_template(name, html, text):
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
    return klaviyo.Templates.create_template(body)


def get_template_id(template):
    return template["data"]["id"]


def get_list_id_by_name(name):
    lists = klaviyo.Lists.get_lists(filter=f"equals(name,'{name}')")
    return lists["data"][0]["id"]


def create_campaign(name, list_id, preview_text, subject, from_email, from_label):
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
    return klaviyo.Campaigns.create_campaign(body)


def get_campaign_id(campaign):
    return campaign["data"]["relationships"]["campaign-messages"]["data"][0]["id"]


def assign_campaign_template(campaign_id, template_id):
    body = {
        "data": {
            "type": "campaign-message",
            "id": campaign_id,
            "relationships": {
                "template": {"data": {"type": "template", "id": template_id}}
            },
        }
    }
    return klaviyo.Campaigns.create_campaign_message_assign_template(body)


def get_templates():
    templates = klaviyo.Templates.get_templates(sort="-created")
    return [t["attributes"] for t in templates["data"]]
