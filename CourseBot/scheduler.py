import logging
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from telegram import Bot
from telegram.error import TelegramError

import database as db
from handlers import kick_from_channels

logger = logging.getLogger(__name__)


async def _remove_expired(bot: Bot) -> None:
    expired = db.get_expired_subscriptions()
    for row in expired:
        uid = row["user_id"]
        plan = row["plan"]
        name = f"@{row['username']}" if row["username"] else row["first_name"]

        logger.info("Removing expired subscription: %s (%s)", name, plan)
        await kick_from_channels(bot, uid, plan)
        db.deactivate_subscription(row["id"])

        try:
            await bot.send_message(
                chat_id=uid,
                text=(
                    "⏰ Your course subscription has expired.\n"
                    "Contact the admin to renew and regain access."
                ),
                protect_content=True,
            )
        except TelegramError as e:
            logger.warning("Could not notify %s about expiry: %s", name, e)


async def _warn_expiring(bot: Bot) -> None:
    rows = db.get_expiring_soon(days=3)
    for row in rows:
        uid = row["user_id"]
        name = f"@{row['username']}" if row["username"] else row["first_name"]
        end = datetime.fromisoformat(row["end_date"])
        days_left = max((end - datetime.utcnow()).days, 0)

        try:
            await bot.send_message(
                chat_id=uid,
                text=(
                    f"⚠️ Your course access expires in *{days_left} day(s)*!\n"
                    "Contact the admin to renew before losing access."
                ),
                parse_mode="Markdown",
                protect_content=True,
            )
            db.mark_warned(row["id"])
            logger.info("Warned %s about expiry in %d days", name, days_left)
        except TelegramError as e:
            logger.warning("Could not warn %s: %s", name, e)


def setup_scheduler(bot: Bot) -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler(timezone="UTC")

    # Check for expired subscriptions every hour
    scheduler.add_job(
        _remove_expired,
        trigger="interval",
        hours=1,
        args=[bot],
        id="remove_expired",
        max_instances=1,
    )

    # Warn users 3 days before expiry — runs daily at 09:00 UTC
    scheduler.add_job(
        _warn_expiring,
        trigger="cron",
        hour=9,
        minute=0,
        args=[bot],
        id="warn_expiring",
        max_instances=1,
    )

    return scheduler
