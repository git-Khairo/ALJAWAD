import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta

DB_PATH = "data/coursebot.db"
os.makedirs("data", exist_ok=True)


def init_db():
    with _conn() as c:
        c.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                user_id   INTEGER PRIMARY KEY,
                username  TEXT,
                first_name TEXT,
                joined_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS subscriptions (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id    INTEGER NOT NULL,
                plan       TEXT NOT NULL,
                start_date TEXT NOT NULL,
                end_date   TEXT NOT NULL,
                active     INTEGER DEFAULT 1,
                warned     INTEGER DEFAULT 0,
                FOREIGN KEY(user_id) REFERENCES users(user_id)
            );

            CREATE TABLE IF NOT EXISTS invite_links (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     INTEGER NOT NULL,
                channel_key TEXT NOT NULL,
                link        TEXT NOT NULL,
                created_at  TEXT DEFAULT (datetime('now')),
                revoked     INTEGER DEFAULT 0
            );

            CREATE INDEX IF NOT EXISTS idx_users_username
                ON users(username);
            CREATE INDEX IF NOT EXISTS idx_subs_active
                ON subscriptions(active, end_date);
            CREATE INDEX IF NOT EXISTS idx_links_user
                ON invite_links(user_id, revoked);
        """)


@contextmanager
def _conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# ── User helpers ──────────────────────────────────────────────────────

def upsert_user(user_id: int, username: str | None, first_name: str) -> None:
    with _conn() as c:
        c.execute(
            """
            INSERT INTO users (user_id, username, first_name)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                username   = excluded.username,
                first_name = excluded.first_name
            """,
            (user_id, (username or "").lower() or None, first_name),
        )


def get_user_by_username(username: str):
    with _conn() as c:
        return c.execute(
            "SELECT * FROM users WHERE lower(username) = lower(?)",
            (username.lstrip("@"),),
        ).fetchone()


def get_user_by_id(user_id: int):
    with _conn() as c:
        return c.execute(
            "SELECT * FROM users WHERE user_id = ?", (user_id,)
        ).fetchone()


# ── Subscription helpers ──────────────────────────────────────────────

def add_subscription(user_id: int, plan: str, days: int = 30) -> tuple[datetime, datetime]:
    start = datetime.utcnow()
    end = start + timedelta(days=days)
    with _conn() as c:
        c.execute(
            "UPDATE subscriptions SET active = 0 WHERE user_id = ? AND active = 1",
            (user_id,),
        )
        c.execute(
            """
            INSERT INTO subscriptions (user_id, plan, start_date, end_date)
            VALUES (?, ?, ?, ?)
            """,
            (user_id, plan, start.isoformat(), end.isoformat()),
        )
    return start, end


def extend_subscription(user_id: int, extra_days: int) -> datetime | None:
    sub = get_active_subscription(user_id)
    if not sub:
        return None
    current_end = datetime.fromisoformat(sub["end_date"])
    new_end = current_end + timedelta(days=extra_days)
    with _conn() as c:
        c.execute(
            "UPDATE subscriptions SET end_date = ?, warned = 0 WHERE id = ?",
            (new_end.isoformat(), sub["id"]),
        )
    return new_end


def get_active_subscription(user_id: int):
    with _conn() as c:
        return c.execute(
            """
            SELECT * FROM subscriptions
            WHERE user_id = ? AND active = 1
            ORDER BY start_date DESC LIMIT 1
            """,
            (user_id,),
        ).fetchone()


def deactivate_subscription(sub_id: int) -> None:
    with _conn() as c:
        c.execute("UPDATE subscriptions SET active = 0 WHERE id = ?", (sub_id,))


def get_expired_subscriptions() -> list:
    now = datetime.utcnow().isoformat()
    with _conn() as c:
        return c.execute(
            """
            SELECT s.*, u.username, u.first_name
            FROM subscriptions s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.active = 1 AND s.end_date <= ?
            """,
            (now,),
        ).fetchall()


def get_expiring_soon(days: int = 3) -> list:
    now = datetime.utcnow()
    threshold = (now + timedelta(days=days)).isoformat()
    with _conn() as c:
        return c.execute(
            """
            SELECT s.*, u.username, u.first_name
            FROM subscriptions s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.active = 1
              AND s.end_date <= ?
              AND s.end_date > ?
              AND s.warned = 0
            """,
            (threshold, now.isoformat()),
        ).fetchall()


def mark_warned(sub_id: int) -> None:
    with _conn() as c:
        c.execute("UPDATE subscriptions SET warned = 1 WHERE id = ?", (sub_id,))


def list_active_subscriptions() -> list:
    with _conn() as c:
        return c.execute(
            """
            SELECT s.*, u.username, u.first_name
            FROM subscriptions s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.active = 1
            ORDER BY s.end_date ASC
            """,
        ).fetchall()


# ── Invite link helpers ───────────────────────────────────────────────

def store_invite_link(user_id: int, channel_key: str, link: str) -> None:
    with _conn() as c:
        c.execute(
            "INSERT INTO invite_links (user_id, channel_key, link) VALUES (?, ?, ?)",
            (user_id, channel_key, link),
        )


def get_active_links(user_id: int) -> list:
    """Return all un-revoked invite links for a user."""
    with _conn() as c:
        return c.execute(
            "SELECT * FROM invite_links WHERE user_id = ? AND revoked = 0",
            (user_id,),
        ).fetchall()


def mark_links_revoked(user_id: int) -> None:
    with _conn() as c:
        c.execute(
            "UPDATE invite_links SET revoked = 1 WHERE user_id = ? AND revoked = 0",
            (user_id,),
        )
