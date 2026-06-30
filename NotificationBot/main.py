import logging

import uvicorn

from api import api
from config import API_PORT, BOT_TOKEN

logging.basicConfig(
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    level=logging.INFO,
)


def main() -> None:
    if not BOT_TOKEN:
        raise SystemExit("BOT_TOKEN is not set — add it to the .env file.")

    # Send-only service: it never polls getUpdates, so it can safely SHARE a bot
    # token with a bot that does poll (e.g. CourseBot). Force the asyncio loop so
    # uvicorn doesn't install uvloop's policy.
    print(f"🔔 NotificationBot API on :{API_PORT}")
    uvicorn.run(api, host="0.0.0.0", port=API_PORT, log_level="info", loop="asyncio")


if __name__ == "__main__":
    main()
