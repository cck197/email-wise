import base64
import hashlib
import hmac
import json
import os

from quart import Blueprint, Response, abort, request

SHOPIFY_API_SECRET = os.environ["SHOPIFY_API_SECRET"]

webhook_bp = Blueprint("webhook", __name__)


def verify_webhook(data, hmac_header):
    digest = hmac.new(
        SHOPIFY_API_SECRET.encode("utf-8"), data, digestmod=hashlib.sha256
    ).digest()
    computed_hmac = base64.b64encode(digest)

    return hmac.compare_digest(computed_hmac, hmac_header.encode("utf-8"))


async def verify_parse():
    data = await request.get_data()
    verified = verify_webhook(data, request.headers.get("X-Shopify-Hmac-SHA256"))

    if not verified:
        abort(401)

    return json.loads(data)


@webhook_bp.route("/customers/data_request", methods=["POST"])
async def customers_data_request():
    # https://shopify.dev/docs/apps/build/privacy-law-compliance#customers-data_request
    parsed_data = await verify_parse()
    print(f"customers_data_request: {parsed_data=}")
    # TODO

    return Response("", 200)


@webhook_bp.route("/customers/redact", methods=["POST"])
async def customers_redact():
    # https://shopify.dev/docs/apps/build/privacy-law-compliance#customers-redact
    parsed_data = await verify_parse()
    print(f"customers_redact: {parsed_data=}")
    # TODO

    return Response("", 200)


@webhook_bp.route("/shop/redact", methods=["POST"])
async def shop_redact():
    # https://shopify.dev/docs/apps/build/privacy-law-compliance#shop-redact-payload
    parsed_data = await verify_parse()
    print(f"shop_redact: {parsed_data=}")
    # TODO

    return Response("", 200)


@webhook_bp.route("/test", methods=["POST"])
async def handle_webhook():
    parsed_data = await verify_parse()
    print(f"handle_webhook: {parsed_data=}")

    return Response("", 200)
