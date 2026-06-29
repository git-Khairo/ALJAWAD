# Configuration and constants for Aljawad Transaction Bot
import os
from dotenv import load_dotenv

load_dotenv()

# ── Secrets / connection (from .env) ──────────────────────────────────────────
BOT_TOKEN      = os.environ.get('BOT_TOKEN', '')
API_BASE_URL   = os.environ.get('API_BASE_URL', 'http://app:80').rstrip('/')
BOT_SECRET     = os.environ.get('BOT_SECRET', '')            # X-Bot-Secret (== Laravel TELEGRAM_BOT_SECRET)
SPREADSHEET_ID = os.environ.get('SPREADSHEET_ID', '1xXIWMVQ6fGwbH8ab3mAPOJ1VwFEx41LQ6wZFBDNW-p4')

# Google Sheets setup
SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
SERVICE_ACCOUNT_FILE = 'aljawad.json'

# Access control — only these Telegram IDs can use the bot
ALLOWED_TELEGRAM_IDS = [
    6198920282,  # Admin 1
    8497478594,
]
# Admins have full access (add + delete + approve)
ADMIN_TELEGRAM_IDS = [6198920282]

# ── Fixed transaction options (mirror config/transactions.php + JS constants) ─
TRANSACTION_TYPE_OPTIONS = ['Withdraw', 'Deposit', 'Wallet Charge', 'Close Debt']
METHOD_OPTIONS = ['Cash', 'USDT', 'Sham Cash']
PLACE_OPTIONS  = ['Damascus', 'Tartus']

# Bot label → dashboard API value
DIRECTION_MAP = {
    'Deposit':       'deposit',
    'Withdraw':      'withdrawal',
    'Wallet Charge': 'wallet_charge',
    'Close Debt':    'close_debt',
}
METHOD_MAP = {
    'Cash':      'cash',
    'USDT':      'usdt',
    'Sham Cash': 'sham_cash',
}
PLACE_MAP = {
    'Damascus': 'damascus',
    'Tartus':   'tartus',
}

# Phone format: starts with 0, exactly 10 digits.
PHONE_REGEX = r'^0\d{9}$'

# Conversation states
MAIN_MENU, SHEET_SELECTION, TYPE, PHONE, METHOD, PLACE, AMOUNT, COMMISSION, NOTES, DELETE_CONFIRM = range(10)

# Global sheet instances to avoid repeated authentication
_sheet_instances = {}

# Pending transactions storage (for admin approval)
# Format: {pending_id: {transaction_data, user_id, message_id}}
pending_transactions = {}

# Timezone
TIMEZONE = 'Asia/Damascus'
