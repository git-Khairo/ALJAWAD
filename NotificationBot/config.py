import os
from dotenv import load_dotenv

load_dotenv()

# IMPORTANT: use the SAME bot token your users have already started (e.g. the
# CourseBot token). A bot can only message users who have previously interacted
# with that exact token — so reusing it lets notifications reach them without
# asking everyone to /start a separate bot.
BOT_TOKEN: str = os.environ.get("BOT_TOKEN", "")

# Shared secret — the Laravel app sends this as the X-Bot-Secret header.
API_SECRET: str = os.environ.get("API_SECRET", "")

API_PORT: int = int(os.environ.get("API_PORT", "8090"))
