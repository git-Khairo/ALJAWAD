import logging
from datetime import datetime, timedelta
from functools import wraps

from telegram import Update
from telegram.error import TelegramError
from telegram.ext import ContextTypes

import database as db
from config import ADMIN_IDS, CHANNEL_IDS, CHANNEL_LABELS, PLANS

logger = logging.getLogger(__name__)

# ── Auth decorator ────────────────────────────────────────────────────

def admin_only(func):
    @wraps(func)
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE):
        if update.effective_user.id not in ADMIN_IDS:
            await update.message.reply_text("⛔ Unauthorized.")
            return
        return await func(update, context)
    return wrapper


# ── Shared helpers ────────────────────────────────────────────────────

async def kick_from_channels(bot, user_id: int, plan: str) -> None:
    """
    Ban the user from all plan channels (no unban) so they can't rejoin via
    old invite links. Also revokes any pending invite links in the database.
    """
    # Revoke all stored invite links for this user
    pending_links = db.get_active_links(user_id)
    for row in pending_links:
        channel_id = CHANNEL_IDS.get(row["channel_key"])
        if not channel_id:
            continue
        try:
            await bot.revoke_chat_invite_link(chat_id=channel_id, invite_link=row["link"])
        except TelegramError as e:
            logger.warning("Could not revoke link for %s / %s: %s", user_id, row["channel_key"], e)
    db.mark_links_revoked(user_id)

    # Ban from channels — no unban so they cannot rejoin
    for key in PLANS[plan]:
        channel_id = CHANNEL_IDS[key]
        try:
            await bot.ban_chat_member(chat_id=channel_id, user_id=user_id)
        except TelegramError as e:
            logger.warning("Could not ban %s from %s: %s", user_id, key, e)


async def unban_from_channels(bot, user_id: int, plan: str) -> None:
    """Unban user from all plan channels so a new invite link can be accepted."""
    for key in PLANS[plan]:
        channel_id = CHANNEL_IDS[key]
        try:
            await bot.unban_chat_member(chat_id=channel_id, user_id=user_id)
        except TelegramError as e:
            logger.warning("Could not unban %s from %s: %s", user_id, key, e)


def _resolve_user(arg: str) -> tuple[int | None, str]:
    """
    Accept either a numeric Telegram user ID or a @username.
    Returns (user_id, display_name) or (None, error_message).
    """
    # Numeric ID provided directly
    if arg.lstrip("@").isdigit():
        uid = int(arg.lstrip("@"))
        row = db.get_user_by_id(uid)
        if not row:
            # First time we see this user — create a minimal record
            db.upsert_user(uid, None, str(uid))
        name = f"@{row['username']}" if row and row["username"] else str(uid)
        return uid, name

    # Username provided
    username = arg.lstrip("@").lower()
    row = db.get_user_by_username(username)
    if not row:
        return None, (
            f"User @{username} not found in the database.\n"
            "Use their numeric Telegram ID instead:\n"
            "`/add 123456789 plan [days]`"
        )
    return row["user_id"], f"@{row['username']}"


# ── User commands ─────────────────────────────────────────────────────

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    db.upsert_user(user.id, user.username, user.first_name)

    # Admin gets a different welcome — no subscription needed
    if user.id in ADMIN_IDS:
        await update.message.reply_text(
            f"👋 Welcome, *{user.first_name}*!\n\n"
            "You're logged in as *Admin*.\n\n"
            "Use `/help` to see all available commands.",
            parse_mode="Markdown",
        )
        return

    sub = db.get_active_subscription(user.id)
    if sub:
        end = datetime.fromisoformat(sub["end_date"])
        days_left = (end - datetime.utcnow()).days
        await update.message.reply_text(
            f"Welcome back, {user.first_name}! 👋\n\n"
            f"Plan: *{sub['plan'].capitalize()}*\n"
            f"Expires in: *{days_left} day(s)*",
            parse_mode="Markdown",
            protect_content=True,
        )
    else:
        await update.message.reply_text(
            f"Welcome, {user.first_name}! 👋\n\n"
            "You don't have an active subscription yet.\n"
            "Contact the admin to get access.",
            protect_content=True,
        )


async def cmd_myplan(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    db.upsert_user(user.id, user.username, user.first_name)

    sub = db.get_active_subscription(user.id)
    if not sub:
        await update.message.reply_text(
            "You have no active subscription.",
            protect_content=True,
        )
        return

    end = datetime.fromisoformat(sub["end_date"])
    days_left = max((end - datetime.utcnow()).days, 0)
    channels = " | ".join(
        CHANNEL_LABELS[k] for k in PLANS[sub["plan"]]
    )

    await update.message.reply_text(
        f"📋 *Your Subscription*\n\n"
        f"Plan: *{sub['plan'].capitalize()}*\n"
        f"Channels: {channels}\n"
        f"Started: {sub['start_date'][:10]}\n"
        f"Expires: {sub['end_date'][:10]}\n"
        f"Days remaining: *{days_left}*",
        parse_mode="Markdown",
        protect_content=True,
    )


# ── Admin commands ────────────────────────────────────────────────────

@admin_only
async def cmd_add(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    /add <@username|user_id> plan [days]

    Plans: beginner | intermediate | expert
    days: optional, default 30
    """
    args = context.args
    if len(args) < 2:
        await update.message.reply_text(
            "Usage: `/add <@username or user_id> plan [days]`\n"
            "Plans: `beginner` | `intermediate` | `expert`\n\n"
            "Examples:\n"
            "`/add 123456789 expert 30`\n"
            "`/add @john beginner`",
            parse_mode="Markdown",
        )
        return

    plan = args[1].lower()
    try:
        days = int(args[2]) if len(args) >= 3 else 30
        if days <= 0:
            raise ValueError
    except ValueError:
        await update.message.reply_text("Days must be a positive number.")
        return

    if plan not in PLANS:
        await update.message.reply_text(
            "Invalid plan. Use: `beginner`, `intermediate`, or `expert`.",
            parse_mode="Markdown",
        )
        return

    uid, display_name = _resolve_user(args[0])
    if uid is None:
        await update.message.reply_text(display_name, parse_mode="Markdown")
        return

    # If user has an existing plan, kick and revoke old links first
    existing = db.get_active_subscription(uid)
    if existing:
        await kick_from_channels(context.bot, uid, existing["plan"])

    # Unban from all target channels so the new invite link can be accepted
    await unban_from_channels(context.bot, uid, plan)

    # Register subscription
    _, end_date = db.add_subscription(uid, plan, days)

    # Create one-time invite links (expire in 72 h) and store them for later revocation
    link_lines_plain = []
    failed_channels = []
    link_expiry = datetime.utcnow() + timedelta(hours=72)

    for key in PLANS[plan]:
        channel_id = CHANNEL_IDS[key]
        try:
            invite = await context.bot.create_chat_invite_link(
                chat_id=channel_id,
                member_limit=1,
                expire_date=link_expiry,
                creates_join_request=False,
            )
            db.store_invite_link(uid, key, invite.invite_link)
            link_lines_plain.append(f"• {CHANNEL_LABELS[key]}: {invite.invite_link}")
        except TelegramError as e:
            logger.error("Invite link failed for %s: %s", key, e)
            failed_channels.append(CHANNEL_LABELS[key])

    if failed_channels:
        await update.message.reply_text(
            f"⚠️ Could not create invite links for: {', '.join(failed_channels)}\n"
            "Make sure the bot is an admin in those channels.",
        )
        return

    # Build link lines as plain HTML (URLs must never go through Markdown)
    link_lines_html = []
    for key in PLANS[plan]:
        label = CHANNEL_LABELS[key]
        # find the matching stored link from link_lines_plain
        for entry in link_lines_plain:
            if entry.startswith(f"• {label}:"):
                url = entry.split(": ", 1)[1].strip()
                link_lines_html.append(f'• <b>{label}</b>: <a href="{url}">{url}</a>')
                break

    links_html = "\n".join(link_lines_html)

    # Always show links in admin chat so they can be forwarded manually
    admin_msg = (
        f"✅ <b>Access granted to {display_name}</b>\n"
        f"Plan: {plan.capitalize()} | Expires: {end_date.strftime('%Y-%m-%d')}\n\n"
        f"📎 <b>Invite links</b> (valid 72 h — forward to the user):\n"
        f"{links_html}"
    )
    await update.message.reply_text(admin_msg, parse_mode="HTML")

    # Also try to DM the user directly (only works if they've started the bot before)
    user_msg = (
        f"🎉 <b>You've been granted course access!</b>\n\n"
        f"Plan: <b>{plan.capitalize()}</b>\n"
        f"Expires: <b>{end_date.strftime('%Y-%m-%d')}</b> ({days} days)\n\n"
        f"Join your channel(s) below — links expire in 72 hours:\n"
        f"{links_html}\n\n"
        f"🔒 Content is protected. Please respect copyright."
    )
    try:
        await context.bot.send_message(
            chat_id=uid,
            text=user_msg,
            parse_mode="HTML",
            protect_content=True,
        )
    except TelegramError:
        # Silent — admin already has the links above
        pass


@admin_only
async def cmd_remove(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/remove <@username|user_id>"""
    if not context.args:
        await update.message.reply_text("Usage: `/remove <@username or user_id>`", parse_mode="Markdown")
        return

    uid, display_name = _resolve_user(context.args[0])
    if uid is None:
        await update.message.reply_text(display_name, parse_mode="Markdown")
        return

    sub = db.get_active_subscription(uid)

    if not sub:
        await update.message.reply_text(f"{display_name} has no active subscription.")
        return

    await kick_from_channels(context.bot, uid, sub["plan"])
    db.deactivate_subscription(sub["id"])

    try:
        await context.bot.send_message(
            chat_id=uid,
            text=(
                "Your course access has been removed by the admin.\n"
                "Contact them to renew your subscription."
            ),
            protect_content=True,
        )
    except TelegramError:
        pass

    await update.message.reply_text(f"✅ Removed {display_name} from all channels.")


@admin_only
async def cmd_extend(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/extend <@username|user_id> days"""
    if len(context.args) < 2:
        await update.message.reply_text(
            "Usage: `/extend <@username or user_id> days`\nExample: `/extend 123456789 30`",
            parse_mode="Markdown",
        )
        return

    try:
        extra_days = int(context.args[1])
        if extra_days <= 0:
            raise ValueError
    except ValueError:
        await update.message.reply_text("Days must be a positive number.")
        return

    uid, display_name = _resolve_user(context.args[0])
    if uid is None:
        await update.message.reply_text(display_name, parse_mode="Markdown")
        return

    new_end = db.extend_subscription(uid, extra_days)
    if not new_end:
        await update.message.reply_text(f"{display_name} has no active subscription.")
        return

    try:
        await context.bot.send_message(
            chat_id=uid,
            text=(
                f"Your subscription has been extended by {extra_days} day(s).\n"
                f"New expiry: {new_end.strftime('%Y-%m-%d')}"
            ),
            protect_content=True,
        )
    except TelegramError:
        pass

    await update.message.reply_text(
        f"✅ Extended {display_name} by {extra_days} day(s).\n"
        f"New expiry: {new_end.strftime('%Y-%m-%d')}"
    )


@admin_only
async def cmd_list(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/list — show all active subscribers"""
    rows = db.list_active_subscriptions()
    if not rows:
        await update.message.reply_text("No active subscriptions.")
        return

    now = datetime.utcnow()
    lines = ["<b>📋 Active Subscriptions</b>\n"]
    for row in rows:
        end = datetime.fromisoformat(row["end_date"])
        days_left = max((end - now).days, 0)
        name = f"@{row['username']}" if row["username"] else row["first_name"]
        lines.append(f"• {name} | {row['plan'].capitalize()} | {days_left}d left")

    await update.message.reply_text("\n".join(lines), parse_mode="HTML")


@admin_only
async def cmd_status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/status @username"""
    if not context.args:
        await update.message.reply_text("Usage: `/status @username`", parse_mode="Markdown")
        return

    uid, display_name = _resolve_user(context.args[0])
    if uid is None:
        await update.message.reply_text(display_name, parse_mode="Markdown")
        return

    sub = db.get_active_subscription(uid)
    if not sub:
        await update.message.reply_text(f"{display_name} has no active subscription.")
        return

    end = datetime.fromisoformat(sub["end_date"])
    days_left = max((end - datetime.utcnow()).days, 0)
    channels = " | ".join(CHANNEL_LABELS[k] for k in PLANS[sub["plan"]])

    await update.message.reply_text(
        f"<b>👤 {display_name}</b>\n"
        f"Plan: {sub['plan'].capitalize()}\n"
        f"Channels: {channels}\n"
        f"Started: {sub['start_date'][:10]}\n"
        f"Expires: {sub['end_date'][:10]}\n"
        f"Days left: {days_left}",
        parse_mode="HTML",
    )


@admin_only
async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "*Admin Commands*\n\n"
        "`/add <user\\_id> plan [days]` — grant access (default 30 days)\n"
        "`/remove <user\\_id>` — revoke access immediately\n"
        "`/extend <user\\_id> days` — extend current subscription\n"
        "`/list` — list all active subscribers\n"
        "`/status <user\\_id>` — check a user's subscription\n\n"
        "💡 Use the numeric Telegram user ID — no need for users to message the bot first\\.\n"
        "Get any user's ID by forwarding their message to @userinfobot\\.\n\n"
        "*Plans:* `beginner` | `intermediate` | `expert`",
        parse_mode="MarkdownV2",
    )
