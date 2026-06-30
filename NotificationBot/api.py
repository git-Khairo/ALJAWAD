import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel
from telegram import Bot
from telegram.constants import ParseMode
from telegram.error import TelegramError

from config import API_SECRET, BOT_TOKEN

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_bot: Bot | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _bot
    _bot = Bot(token=BOT_TOKEN)
    await _bot.initialize()
    yield
    if _bot:
        await _bot.shutdown()


api = FastAPI(lifespan=lifespan, title="NotificationBot API")


def verify_secret(x_bot_secret: str = Header(default="")):
    if API_SECRET and x_bot_secret != API_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret")


class BroadcastRequest(BaseModel):
    message: str
    chat_ids: list[int]
    parse_mode: str | None = None  # optional: "HTML" or "MarkdownV2"


@api.get("/health")
async def health():
    return {"ok": True}


@api.post("/broadcast")
async def broadcast(req: BroadcastRequest, _=Depends(verify_secret)):
    """
    Send `message` to every chat_id. A chat_id only works if that user has
    previously started the bot that owns BOT_TOKEN — there is no way around
    this Telegram restriction. Unreachable users are returned in `failed`.
    """
    if not req.message.strip():
        raise HTTPException(status_code=422, detail="message is empty")

    parse_mode = None
    if req.parse_mode == "HTML":
        parse_mode = ParseMode.HTML
    elif req.parse_mode == "MarkdownV2":
        parse_mode = ParseMode.MARKDOWN_V2

    sent = 0
    failed: list[dict] = []
    for cid in req.chat_ids:
        try:
            await _bot.send_message(chat_id=cid, text=req.message, parse_mode=parse_mode)
            sent += 1
            # Gentle pacing to stay under Telegram's ~30 msg/sec ceiling.
            await asyncio.sleep(0.04)
        except TelegramError as e:
            logger.warning("send to %s failed: %s", cid, e)
            failed.append({"chat_id": cid, "error": str(e)})

    return {"ok": True, "sent": sent, "failed": failed, "total": len(req.chat_ids)}
