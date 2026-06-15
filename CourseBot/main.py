import logging
import os
import threading

import uvicorn
from telegram.ext import Application, CommandHandler

import database as db
from api import api
from config import BOT_TOKEN
from handlers import (
    cmd_add,
    cmd_extend,
    cmd_help,
    cmd_list,
    cmd_myplan,
    cmd_remove,
    cmd_start,
    cmd_status,
)
from scheduler import setup_scheduler

logging.basicConfig(
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    level=logging.INFO,
)
logging.getLogger("httpx").setLevel(logging.WARNING)


def _run_api() -> None:
    port = int(os.environ.get("API_PORT", 8080))
    uvicorn.run(api, host="0.0.0.0", port=port, log_level="info")


async def _post_init(app: Application) -> None:
    # Start the scheduler here: this runs inside PTB's event loop, so
    # AsyncIOScheduler can bind to the running loop (avoids the
    # "no current event loop in thread 'MainThread'" crash at startup).
    scheduler = setup_scheduler(app.bot)
    scheduler.start()
    # Keep a reference so the scheduler isn't garbage-collected.
    app.bot_data["scheduler"] = scheduler


def main() -> None:
    db.init_db()

    # Start HTTP API in a background daemon thread
    api_thread = threading.Thread(target=_run_api, daemon=True)
    api_thread.start()

    app = Application.builder().token(BOT_TOKEN).post_init(_post_init).build()

    # User commands
    app.add_handler(CommandHandler("start",  cmd_start))
    app.add_handler(CommandHandler("myplan", cmd_myplan))

    # Admin commands
    app.add_handler(CommandHandler("add",    cmd_add))
    app.add_handler(CommandHandler("remove", cmd_remove))
    app.add_handler(CommandHandler("extend", cmd_extend))
    app.add_handler(CommandHandler("list",   cmd_list))
    app.add_handler(CommandHandler("status", cmd_status))
    app.add_handler(CommandHandler("help",   cmd_help))

    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()
