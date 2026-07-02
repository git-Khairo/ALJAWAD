import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN: str = os.environ["BOT_TOKEN"]

# Laravel app callback — used to auto-link a client's Telegram chat id when they
# press START with a `link_<token>` deep link from the CSAT rating page.
API_BASE_URL: str = os.environ.get("API_BASE_URL", "")
API_SECRET: str = os.environ.get("API_SECRET", "")

ADMIN_IDS: list[int] = [
    int(x.strip()) for x in os.environ["ADMIN_IDS"].split(",") if x.strip()
]

# Maps plan name → list of channel keys the plan unlocks
PLANS: dict[str, list[str]] = {
    "beginner":     ["beginner"],
    "intermediate": ["beginner", "intermediate"],
    "expert":       ["beginner", "intermediate", "expert"],
}

CHANNEL_IDS: dict[str, int] = {
    "beginner":     int(os.environ["BEGINNER_CHANNEL_ID"]),
    "intermediate": int(os.environ["INTERMEDIATE_CHANNEL_ID"]),
    "expert":       int(os.environ["EXPERT_CHANNEL_ID"]),
}

CHANNEL_LABELS: dict[str, str] = {
    "beginner":     "Beginner",
    "intermediate": "Intermediate",
    "expert":       "Expert",
}
