"""Thin HTTP client for the dashboard bot API (X-Bot-Secret protected)."""
import logging
import requests

from config import API_BASE_URL, BOT_SECRET

logger = logging.getLogger(__name__)


def _headers():
    return {'X-Bot-Secret': BOT_SECRET, 'Accept': 'application/json'}


def post_transaction(payload: dict) -> dict:
    """
    POST a transaction to the dashboard (the system of record).
    Returns:
      {'ok': True,  'data': {...}}                 on 200/201
      {'ok': False, 'status': int, 'error': str}   otherwise (message surfaced when available)
    """
    try:
        resp = requests.post(
            f"{API_BASE_URL}/api/bot/transactions",
            json=payload,
            headers=_headers(),
            timeout=15,
        )
        if resp.status_code in (200, 201):
            return {'ok': True, 'data': resp.json()}

        message = None
        try:
            body = resp.json()
            message = body.get('message')
            errors = body.get('errors') or {}
            if errors:
                first = next(iter(errors.values()))
                message = first[0] if isinstance(first, list) else first
        except Exception:
            pass
        return {'ok': False, 'status': resp.status_code, 'error': message or f'HTTP {resp.status_code}'}
    except Exception as e:
        logger.error("post_transaction failed: %s", e)
        return {'ok': False, 'status': 0, 'error': str(e)}


def lookup_client(phone: str) -> dict:
    """GET the client for a phone — {'ok': bool, 'found': bool, 'client'?: {...}}."""
    try:
        resp = requests.get(
            f"{API_BASE_URL}/api/bot/clients/{phone}",
            headers=_headers(),
            timeout=10,
        )
        if resp.status_code == 200:
            return resp.json()
        return {'ok': False, 'found': False}
    except Exception as e:
        logger.error("lookup_client failed: %s", e)
        return {'ok': False, 'found': False}
