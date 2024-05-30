import os
from urllib.parse import urlparse

from dotenv import load_dotenv

load_dotenv("../.env")

from quart import Quart
from quart_cors import cors

from generator.db import connect, get_client

from .sse import sse_bp

app = Quart(__name__)


SHOPIFY_APP_URL = os.environ["SHOPIFY_APP_URL"]


def get_cors_pattern():
    parsed_url = urlparse(SHOPIFY_APP_URL)
    domain = parsed_url.netloc
    cors_pattern = (
        rf"^(https?://{domain.replace('.', r'\.')}|http://localhost(:[0-9]+)?)$"
    )
    print(f"{cors_pattern=}")


# Initialize the Quart app and apply CORS settings
# app = cors(app, allow_origin="*")  # get_cors_pattern())


app = cors(app, allow_origin="*")
app.register_blueprint(sse_bp, url_prefix="/sse")


@app.before_serving
async def connect_to_db():
    await connect()


@app.after_serving
async def disconnect_from_db():
    await get_client().disconnect()


def run():
    app.run(debug=True)
