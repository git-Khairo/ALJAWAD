import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel
from telegram import Bot
from telegram.error import TelegramError

import database as db
from config import BOT_TOKEN, CHANNEL_IDS, CHANNEL_LABELS, PLANS

logger = logging.getLogger(__name__)

API_SECRET = os.environ.get("API_SECRET", "")

# ── Bot instance (shared across requests) ─────────────────────────────────────

_bot: Bot | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _bot
    _bot = Bot(token=BOT_TOKEN)
    await _bot.initialize()
    yield
    if _bot:
        await _bot.shutdown()


api = FastAPI(lifespan=lifespan, title="CourseBot API")


# ── Auth ──────────────────────────────────────────────────────────────────────

def verify_secret(x_bot_secret: str = Header(default="")):
    if API_SECRET and x_bot_secret != API_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret")


# ── Schemas ───────────────────────────────────────────────────────────────────

class GrantRequest(BaseModel):
    telegram_chat_id: int
    plan: str
    access_days: int = 30


class RevokeRequest(BaseModel):
    telegram_chat_id: int


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _kick(bot: Bot, user_id: int, plan: str) -> None:
    pending = db.get_active_links(user_id)
    for row in pending:
        cid = CHANNEL_IDS.get(row["channel_key"])
        if cid:
            try:
                await bot.revoke_chat_invite_link(chat_id=cid, invite_link=row["link"])
            except TelegramError:
                pass
    db.mark_links_revoked(user_id)
    for key in PLANS[plan]:
        try:
            await bot.ban_chat_member(chat_id=CHANNEL_IDS[key], user_id=user_id)
        except TelegramError as e:
            logger.warning("Ban failed %s / %s: %s", user_id, key, e)


async def _unban(bot: Bot, user_id: int, plan: str) -> None:
    for key in PLANS[plan]:
        try:
            await bot.unban_chat_member(chat_id=CHANNEL_IDS[key], user_id=user_id)
        except TelegramError as e:
            logger.warning("Unban failed %s / %s: %s", user_id, key, e)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@api.get("/health")
async def health():
    return {"ok": True}


@api.post("/grant")
async def grant_access(req: GrantRequest, _=Depends(verify_secret)):
    if req.plan not in PLANS:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid plan '{req.plan}'. Valid: {', '.join(PLANS)}"
        )

    uid = req.telegram_chat_id

    # Kick from current channels if already subscribed
    existing = db.get_active_subscription(uid)
    if existing:
        await _kick(_bot, uid, existing["plan"])

    # Unban from target channels so invite links can be accepted
    await _unban(_bot, uid, req.plan)

    # Register subscription in bot DB
    _, end_date = db.add_subscription(uid, req.plan, req.access_days)

    # Create one-time invite links (expire in 72 h)
    link_expiry = datetime.utcnow() + timedelta(hours=72)
    invite_links = []
    failed = []

    for key in PLANS[req.plan]:
        try:
            invite = await _bot.create_chat_invite_link(
                chat_id=CHANNEL_IDS[key],
                member_limit=1,
                expire_date=link_expiry,
                creates_join_request=False,
            )
            db.store_invite_link(uid, key, invite.invite_link)
            invite_links.append({"channel": CHANNEL_LABELS[key], "link": invite.invite_link})
        except TelegramError as e:
            logger.error("Invite link failed for %s: %s", key, e)
            failed.append(CHANNEL_LABELS[key])

    if failed:
        raise HTTPException(
            status_code=500,
            detail=f"Could not create invite links for: {', '.join(failed)}. "
                   "Make sure the bot is admin in those channels."
        )

    return {
        "ok":          True,
        "plan":        req.plan,
        "expires_at":  end_date.isoformat(),
        "invite_links": invite_links,
    }


@api.post("/revoke")
async def revoke_access(req: RevokeRequest, _=Depends(verify_secret)):
    uid = req.telegram_chat_id
    sub = db.get_active_subscription(uid)

    if not sub:
        raise HTTPException(status_code=404, detail=f"No active subscription for user {uid}")

    await _kick(_bot, uid, sub["plan"])
    db.deactivate_subscription(sub["id"])

    return {"ok": True, "message": f"Access revoked for {uid}"}


@api.get("/status/{telegram_chat_id}")
async def get_status(telegram_chat_id: int, _=Depends(verify_secret)):
    sub = db.get_active_subscription(telegram_chat_id)
    if not sub:
        return {"ok": True, "active": False}

    now = datetime.utcnow()
    end = datetime.fromisoformat(sub["end_date"])
    return {
        "ok":        True,
        "active":    True,
        "plan":      sub["plan"],
        "end_date":  sub["end_date"],
        "days_left": max((end - now).days, 0),
    }


@api.get("/subscriptions")
async def list_subscriptions(_=Depends(verify_secret)):
    rows = db.list_active_subscriptions()
    now = datetime.utcnow()
    return {
        "ok": True,
        "data": [
            {
                "user_id":    row["user_id"],
                "username":   row["username"],
                "first_name": row["first_name"],
                "plan":       row["plan"],
                "end_date":   row["end_date"],
                "days_left":  max((datetime.fromisoformat(row["end_date"]) - now).days, 0),
            }
            for row in rows
        ],
    }
