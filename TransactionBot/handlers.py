import logging
import time
import traceback
from telegram import Update, ReplyKeyboardMarkup, ReplyKeyboardRemove, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes, ConversationHandler
from datetime import datetime
import pytz
import uuid

import re

from config import (
    MAIN_MENU, SHEET_SELECTION, TYPE, PHONE, METHOD, PLACE, AMOUNT, COMMISSION, NOTES,
    DELETE_CONFIRM, pending_transactions, TIMEZONE, ADMIN_TELEGRAM_IDS,
    TRANSACTION_TYPE_OPTIONS, METHOD_OPTIONS, PLACE_OPTIONS,
    DIRECTION_MAP, METHOD_MAP, PLACE_MAP, PHONE_REGEX
)
from services import (
    init_google_sheets, get_next_id, is_user_allowed,
    is_admin, escape_markdown, get_main_menu_keyboard,
    get_sheet_menu_keyboard, get_type_keyboard, get_method_keyboard, get_place_keyboard,
    get_commission_keyboard, get_notes_keyboard, send_access_denied,
    generate_transaction_invoice_pdf
)
import api_client

async def show_main_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.message.from_user
    
    # Check if user is allowed to access the bot
    if not is_user_allowed(user.id):
        await send_access_denied(update)
        return ConversationHandler.END
    
    context.user_data['telegram_id'] = user.id
    context.user_data['telegram_name'] = user.username or user.first_name
    
    admin_status = " 👑" if is_admin(user.id) else ""
    user_type = "Administrator" if is_admin(user.id) else "User"
    
    welcome_text = f"""
✨ *Welcome {user.first_name}*{admin_status}!

*Account Type:* {user_type}
*Telegram ID:* `{user.id}`

I'm your financial records assistant.

💼 *Transactions* - Add a deposit/withdrawal entry

_Select an option from the menu below:_
    """
    
    await update.message.reply_text(
        welcome_text,
        reply_markup=get_main_menu_keyboard(user.id),
        parse_mode='Markdown'
    )
    return MAIN_MENU

# Start command
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    return await show_main_menu(update, context)

# Handle any message that isn't a command (shows main menu immediately)
async def handle_any_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.message.from_user
    
    # Check if user is allowed to access the bot
    if not is_user_allowed(user.id):
        await send_access_denied(update)
        return ConversationHandler.END
    
    # If user sends any message and we're not in a conversation, show main menu
    if not context.user_data.get('in_conversation', False):
        return await show_main_menu(update, context)
    
    # If we're already in a conversation, let the conversation handler deal with it
    return

# Handle main menu selections (sheet selection)
async def handle_main_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_choice = update.message.text
    user_id = update.message.from_user.id
    
    # Check if user is allowed to access the bot
    if not is_user_allowed(user_id):
        await send_access_denied(update)
        return ConversationHandler.END
    
    # Mark that we're in a conversation
    context.user_data['in_conversation'] = True
    
    if user_choice == '💼 Transactions':
        context.user_data['current_sheet'] = 'Transactions'
        await update.message.reply_text(
            "💼 *Transactions Sheet*\n\nChoose an action:",
            reply_markup=get_sheet_menu_keyboard(user_id, 'Transactions'),
            parse_mode='Markdown'
        )
        return SHEET_SELECTION

    elif user_choice == '❌ Cancel':
        context.user_data['in_conversation'] = False
        await update.message.reply_text(
            "👋 Operation cancelled. Send any message to start again.",
            reply_markup=ReplyKeyboardRemove()
        )
        return ConversationHandler.END
    
    else:
        await update.message.reply_text(
            "Please select a valid option from the menu:",
            reply_markup=get_main_menu_keyboard(user_id)
        )
        return MAIN_MENU

# Handle sheet menu selections
async def handle_sheet_selection(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_choice = update.message.text
    user_id = update.message.from_user.id
    current_sheet = context.user_data.get('current_sheet', 'Transactions')
    
    # Check if user is allowed to access the bot
    if not is_user_allowed(user_id):
        await send_access_denied(update)
        return ConversationHandler.END
    
    if user_choice == '🔙 Back to Main Menu':
        await update.message.reply_text(
            "🏠 *Main Menu*",
            reply_markup=get_main_menu_keyboard(user_id),
            parse_mode='Markdown'
        )
        return MAIN_MENU
    
    if current_sheet == 'Transactions':
        if user_choice == '📥 Add Transaction':
            await update.message.reply_text(
                "💳 *Select Transaction Type:*",
                reply_markup=get_type_keyboard(),
                parse_mode='Markdown'
            )
            return TYPE
            
        elif user_choice == '🗑️ Delete Transaction':
            if not is_admin(user_id):
                await update.message.reply_text(
                    "❌ *Access Denied*\n\nThis feature is for administrators only.",
                    reply_markup=get_sheet_menu_keyboard(user_id, 'Transactions'),
                    parse_mode='Markdown'
                )
                return SHEET_SELECTION
            
            await update.message.reply_text(
                "🔢 *Delete Transaction*\n\nPlease enter the Transaction ID you want to delete:",
                reply_markup=ReplyKeyboardMarkup([['🔙 Back to Main Menu']], resize_keyboard=True)
            )
            return DELETE_CONFIRM
    
    await update.message.reply_text(
        "Please select a valid option from the menu:",
        reply_markup=get_sheet_menu_keyboard(user_id, current_sheet)
    )
    return SHEET_SELECTION

# ===== TRANSACTIONS FLOW =====

# Type handler for Transactions
async def type_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_choice = update.message.text
    user_id = update.message.from_user.id
    
    # Check if user is allowed to access the bot
    if not is_user_allowed(user_id):
        await send_access_denied(update)
        return ConversationHandler.END
    
    if user_choice == '🔙 Back to Main Menu':
        await update.message.reply_text(
            "🏠 *Main Menu*",
            reply_markup=get_main_menu_keyboard(user_id),
            parse_mode='Markdown'
        )
        return MAIN_MENU
    
    selected_type = user_choice.replace('🔹 ', '').strip()
    if selected_type not in TRANSACTION_TYPE_OPTIONS:
        await update.message.reply_text(
            "Please select a valid transaction type:",
            reply_markup=get_type_keyboard()
        )
        return TYPE
    context.user_data['type'] = selected_type
    
    await update.message.reply_text(
        "📱 *Enter Client Phone:*\n\nMust start with 0 and be 10 digits (e.g. `09XXXXXXXX`):",
        reply_markup=ReplyKeyboardMarkup([['🔙 Back to Main Menu']], resize_keyboard=True),
        parse_mode='Markdown'
    )
    return PHONE

# Phone handler for Transactions (replaces full name; links to a dashboard client)
async def phone_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_choice = update.message.text
    user_id = update.message.from_user.id

    # Check if user is allowed to access the bot
    if not is_user_allowed(user_id):
        await send_access_denied(update)
        return ConversationHandler.END

    if user_choice == '🔙 Back to Main Menu':
        await update.message.reply_text(
            "🏠 *Main Menu*",
            reply_markup=get_main_menu_keyboard(user_id),
            parse_mode='Markdown'
        )
        return MAIN_MENU

    phone = user_choice.strip()
    if not re.match(PHONE_REGEX, phone):
        await update.message.reply_text(
            "❌ *Invalid Phone*\n\nIt must start with 0 and be exactly 10 digits (e.g. `09XXXXXXXX`):",
            reply_markup=ReplyKeyboardMarkup([['🔙 Back to Main Menu']], resize_keyboard=True),
            parse_mode='Markdown'
        )
        return PHONE

    context.user_data['phone'] = phone

    await update.message.reply_text("💸 *Select Payment Method:*", reply_markup=get_method_keyboard(), parse_mode='Markdown')
    return METHOD

# Method handler for Transactions
async def method_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_choice = update.message.text
    user_id = update.message.from_user.id
    
    # Check if user is allowed to access the bot
    if not is_user_allowed(user_id):
        await send_access_denied(update)
        return ConversationHandler.END
    
    if user_choice == '🔙 Back to Main Menu':
        await update.message.reply_text(
            "🏠 *Main Menu*",
            reply_markup=get_main_menu_keyboard(user_id),
            parse_mode='Markdown'
        )
        return MAIN_MENU
    
    selected_method = user_choice.replace('💳 ', '').strip()
    if selected_method not in METHOD_OPTIONS:
        await update.message.reply_text(
            "Please select a valid payment method:",
            reply_markup=get_method_keyboard()
        )
        return METHOD
    context.user_data['method'] = selected_method

    await update.message.reply_text(
        "📍 *Select Place:*",
        reply_markup=get_place_keyboard(),
        parse_mode='Markdown'
    )
    return PLACE

# Place handler for Transactions
async def place_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_choice = update.message.text
    user_id = update.message.from_user.id

    if not is_user_allowed(user_id):
        await send_access_denied(update)
        return ConversationHandler.END

    if user_choice == '🔙 Back to Main Menu':
        await update.message.reply_text(
            "🏠 *Main Menu*",
            reply_markup=get_main_menu_keyboard(user_id),
            parse_mode='Markdown'
        )
        return MAIN_MENU

    selected_place = user_choice.replace('📍 ', '').strip()
    if selected_place not in PLACE_OPTIONS:
        await update.message.reply_text(
            "Please select a valid place:",
            reply_markup=get_place_keyboard()
        )
        return PLACE

    context.user_data['place'] = selected_place
    await update.message.reply_text(
        "💰 *Enter Amount:*\n\nPlease type the amount:",
        reply_markup=ReplyKeyboardMarkup([['🔙 Back to Main Menu']], resize_keyboard=True),
        parse_mode='Markdown'
    )
    return AMOUNT

# Amount handler for Transactions
async def amount_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_choice = update.message.text
    user_id = update.message.from_user.id
    
    # Check if user is allowed to access the bot
    if not is_user_allowed(user_id):
        await send_access_denied(update)
        return ConversationHandler.END
    
    if user_choice == '🔙 Back to Main Menu':
        await update.message.reply_text(
            "🏠 *Main Menu*",
            reply_markup=get_main_menu_keyboard(user_id),
            parse_mode='Markdown'
        )
        return MAIN_MENU
    
    try:
        amount = float(user_choice)
        context.user_data['amount'] = amount
        
        await update.message.reply_text(
            "💲 *Commission*\n\nWould you like to add commission?",
            reply_markup=get_commission_keyboard(),
            parse_mode='Markdown'
        )
        return COMMISSION
    except ValueError:
        await update.message.reply_text(
            "❌ *Invalid Amount*\n\nPlease enter a valid number for the amount:",
            reply_markup=ReplyKeyboardMarkup([['🔙 Back to Main Menu']], resize_keyboard=True),
            parse_mode='Markdown'
        )
        return AMOUNT

# Commission handler for Transactions
async def commission_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_choice = update.message.text
    user_id = update.message.from_user.id
    
    # Check if user is allowed to access the bot
    if not is_user_allowed(user_id):
        await send_access_denied(update)
        return ConversationHandler.END
    
    if user_choice == '🔙 Back to Main Menu':
        await update.message.reply_text(
            "🏠 *Main Menu*",
            reply_markup=get_main_menu_keyboard(user_id),
            parse_mode='Markdown'
        )
        return MAIN_MENU
    elif user_choice == '💲 Add Commission':
        await update.message.reply_text(
            "💸 *Enter Commission Amount:*\n\nPlease type the commission amount:",
            reply_markup=ReplyKeyboardMarkup([['🔙 Back to Main Menu']], resize_keyboard=True),
            parse_mode='Markdown'
        )
        return COMMISSION
    elif user_choice == '⏩ Skip Commission':
        context.user_data['commission'] = ''
        await update.message.reply_text(
            "📝 *Add Notes*\n\nWould you like to add any notes?",
            reply_markup=get_notes_keyboard(),
            parse_mode='Markdown'
        )
        return NOTES
    else:
        # User typed commission amount directly
        try:
            commission = float(user_choice)
            context.user_data['commission'] = commission
            
            await update.message.reply_text(
                "📝 *Add Notes*\n\nWould you like to add any notes?",
                reply_markup=get_notes_keyboard(),
                parse_mode='Markdown'
            )
            return NOTES
        except ValueError:
            await update.message.reply_text(
                "❌ *Invalid Commission Amount*\n\nPlease enter a valid number for the commission:",
                reply_markup=get_commission_keyboard(),
                parse_mode='Markdown'
            )
            return COMMISSION

# Notes handler for Transactions
async def notes_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_choice = update.message.text
    user_id = update.message.from_user.id
    
    # Check if user is allowed to access the bot
    if not is_user_allowed(user_id):
        await send_access_denied(update)
        return ConversationHandler.END
    
    if user_choice == '🔙 Back to Main Menu':
        await update.message.reply_text(
            "🏠 *Main Menu*",
            reply_markup=get_main_menu_keyboard(user_id),
            parse_mode='Markdown'
        )
        return MAIN_MENU
    elif user_choice == '📝 Add Notes':
        await update.message.reply_text(
            "✏️ *Enter Notes:*\n\nPlease type your notes:",
            reply_markup=ReplyKeyboardMarkup([['🔙 Back to Main Menu']], resize_keyboard=True),
            parse_mode='Markdown'
        )
        return NOTES
    elif user_choice == '⏩ Skip Notes':
        context.user_data['notes'] = ""
        return await save_transaction_record(update, context)
    else:
        # User typed notes directly
        context.user_data['notes'] = user_choice
        return await save_transaction_record(update, context)

# Save transaction record to Google Sheets (called after admin approval)
async def save_transaction_to_sheets(transaction_data: dict, record_id: int):
    """Actually save the transaction to Google Sheets"""
    max_retries = 3
    retry_delay = 2  # seconds
    
    for attempt in range(max_retries):
        try:
            sheet = init_google_sheets("Transactions")
            
            # Keep skipped commission blank to avoid Sheet time-format coercion
            commission_value = transaction_data.get('commission', '')
            if commission_value in (None, ''):
                commission_to_save = ''
            else:
                try:
                    commission_to_save = float(commission_value)
                except (TypeError, ValueError):
                    commission_to_save = commission_value

            # Prepare data
            record_data = [
                record_id,
                transaction_data['type'],
                transaction_data.get('client_name') or transaction_data.get('phone', ''),
                transaction_data['method'],
                transaction_data['amount'],
                transaction_data['place'],
                commission_to_save,
                transaction_data['date'],
                transaction_data.get('notes', ''),
                transaction_data['telegram_id'],
                transaction_data['telegram_name']
            ]
            
            # Find the next empty row (starting from row 4)
            all_data = sheet.get_all_values()
            next_row = len(all_data) + 1
            
            # Ensure we start from row 4 (rows 1-3 are headers)
            if next_row < 4:
                next_row = 4
            
            # Write to the specific row
            for col, value in enumerate(record_data, start=1):
                sheet.update_cell(next_row, col, value)
            
            return True  # Success
            
        except Exception as e:
            logging.error(f"Error saving transaction record (attempt {attempt + 1}): {e}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
                continue
            else:
                return False  # Failed after all retries
    
    return False

# Save transaction record - Now sends approval request to admins
async def save_transaction_record(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.message.from_user.id
    
    # Check if user is allowed to access the bot
    if not is_user_allowed(user_id):
        await send_access_denied(update)
        return ConversationHandler.END
    
    try:
        # Get current date/time in Egypt timezone
        egypt_tz = pytz.timezone(TIMEZONE)
        current_date = datetime.now(egypt_tz).strftime("%Y-%m-%d %H:%M:%S")
        
        commission_value = context.user_data.get('commission', '')
        if commission_value in (None, ''):
            commission_text = "None"
        else:
            try:
                commission_text = f"{float(commission_value):,.2f}"
            except (TypeError, ValueError):
                commission_text = str(commission_value)

        # Prepare transaction data
        transaction_data = {
            'type': context.user_data['type'],
            'phone': context.user_data['phone'],
            'method': context.user_data['method'],
            'place': context.user_data['place'],
            'amount': context.user_data['amount'],
            'commission': commission_value,
            'date': current_date,
            'notes': context.user_data.get('notes', ''),
            'telegram_id': context.user_data['telegram_id'],
            'telegram_name': context.user_data['telegram_name']
        }
        
        # Generate unique pending transaction ID
        pending_id = str(uuid.uuid4())
        
        # Store pending transaction
        pending_transactions[pending_id] = {
            'transaction_data': transaction_data,
            'user_id': user_id,
            'message_id': update.message.message_id
        }
        
        # Create approval message for admins
        # Escape user input to prevent Markdown parsing errors
        safe_full_name = escape_markdown(transaction_data['phone'])
        safe_notes = escape_markdown(transaction_data.get('notes', 'None') or 'None')
        safe_telegram_name = escape_markdown(transaction_data['telegram_name'])
        safe_type = escape_markdown(transaction_data['type'])
        safe_method = escape_markdown(transaction_data['method'])
        safe_date = escape_markdown(current_date)
        
        # Build message using HTML format (more reliable than Markdown)
        # HTML escape function for special characters
        def html_escape(text):
            if not text:
                return ""
            text = str(text)
            text = text.replace('&', '&amp;')
            text = text.replace('<', '&lt;')
            text = text.replace('>', '&gt;')
            return text
        
        safe_full_name_html = html_escape(transaction_data['phone'])
        safe_notes_html = html_escape(transaction_data.get('notes', 'None') or 'None')
        safe_telegram_name_html = html_escape(transaction_data['telegram_name'])
        safe_type_html = html_escape(transaction_data['type'])
        safe_method_html = html_escape(transaction_data['method'])
        safe_date_html = html_escape(current_date)
        
        approval_text = f"""🔔 <b>New Transaction Pending Approval</b>

📋 <b>Transaction Details:</b>
🔄 Type: {safe_type_html}
📱 Phone: {safe_full_name_html}
💳 Method: {safe_method_html}
📍 Place: {html_escape(transaction_data['place'])}
💰 Amount: {transaction_data['amount']:,.2f}
💲 Commission: {commission_text}
📅 Date: {safe_date_html}
📝 Notes: {safe_notes_html}
👤 User: {safe_telegram_name_html} (ID: {transaction_data['telegram_id']})
🆔 Pending ID: {pending_id[:8]}

<i>Please review and approve or cancel this transaction.</i>"""
        
        # Create inline keyboard with Accept and Cancel buttons
        keyboard = [
            [
                InlineKeyboardButton("✅ Accept", callback_data=f"approve_{pending_id}"),
                InlineKeyboardButton("❌ Cancel", callback_data=f"cancel_{pending_id}")
            ]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        # Send approval request to all admins
        admin_notified = False
        for admin_id in ADMIN_TELEGRAM_IDS:
            try:
                await context.bot.send_message(
                    chat_id=admin_id,
                    text=approval_text,
                    reply_markup=reply_markup,
                    parse_mode='HTML'
                )
                admin_notified = True
            except Exception as e:
                logging.error(f"Error sending approval request to admin {admin_id}: {e}")
        
        if not admin_notified:
            await update.message.reply_text(
                "❌ *Error*\n\nCould not send approval request to administrators. Please try again.",
                reply_markup=get_sheet_menu_keyboard(user_id, 'Transactions'),
                parse_mode='Markdown'
            )
            return SHEET_SELECTION
        
        # Notify user that transaction is pending approval
        await update.message.reply_text(
            "⏳ *Transaction Submitted for Approval*\n\n"
            "Your transaction has been sent to administrators for review.\n"
            "You will be notified once it's approved or canceled.",
            reply_markup=get_sheet_menu_keyboard(user_id, 'Transactions'),
            parse_mode='Markdown'
        )
        
        # Clear user data but keep conversation state
        for key in ['type', 'phone', 'method', 'place', 'amount', 'commission', 'notes']:
            context.user_data.pop(key, None)
        
    except Exception as e:
        logging.error(f"Error in save_transaction_record: {e}")
        await update.message.reply_text(
            "❌ *Error Processing Transaction*\n\nPlease try again.",
            reply_markup=get_sheet_menu_keyboard(user_id, 'Transactions'),
            parse_mode='Markdown'
        )
    
    return SHEET_SELECTION

# Delete transaction record handler
async def delete_record_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_choice = update.message.text
    user_id = update.message.from_user.id
    
    # Check if user is allowed to access the bot
    if not is_user_allowed(user_id):
        await send_access_denied(update)
        return ConversationHandler.END
    
    if user_choice == '🔙 Back to Main Menu':
        await update.message.reply_text(
            "🏠 *Main Menu*",
            reply_markup=get_main_menu_keyboard(user_id),
            parse_mode='Markdown'
        )
        return MAIN_MENU
    
    try:
        record_id = int(user_choice)
        await execute_transaction_delete(update, context, record_id)
    except ValueError:
        await update.message.reply_text(
            "❌ *Invalid Record ID*\n\nPlease enter a valid number:",
            reply_markup=ReplyKeyboardMarkup([['🔙 Back to Main Menu']], resize_keyboard=True),
            parse_mode='Markdown'
        )
        return DELETE_CONFIRM

# Execute transaction deletion
async def execute_transaction_delete(update: Update, context: ContextTypes.DEFAULT_TYPE, record_id: int):
    user_id = update.message.from_user.id
    
    # Check if user is allowed to access the bot
    if not is_user_allowed(user_id):
        await send_access_denied(update)
        return ConversationHandler.END
    
    try:
        sheet = init_google_sheets("Transactions")
        all_data = sheet.get_all_values()
        
        # Skip first 3 rows (headers - data starts from row 4)
        records_data = all_data[3:] if len(all_data) > 3 else []
        
        # Find and delete the record (data starts from row 4, so enumerate starts at 4)
        for i, record in enumerate(records_data, start=4):
            if len(record) > 0 and str(record[0]) == str(record_id):
                sheet.delete_rows(i)
                
                await update.message.reply_text(
                    f"✅ *Transaction Deleted Successfully!*\n\nRecord ID `{record_id}` has been removed.",
                    reply_markup=get_sheet_menu_keyboard(user_id, 'Transactions'),
                    parse_mode='Markdown'
                )
                return SHEET_SELECTION
        
        await update.message.reply_text(
            f"❌ *Transaction Not Found*\n\nRecord ID `{record_id}` was not found.",
            reply_markup=get_sheet_menu_keyboard(user_id, 'Transactions'),
            parse_mode='Markdown'
        )
        return SHEET_SELECTION
        
    except Exception as e:
        logging.error(f"Error deleting transaction: {e}")
        await update.message.reply_text(
            "❌ *Error Deleting Transaction*\n\nPlease try again.",
            reply_markup=get_sheet_menu_keyboard(user_id, 'Transactions'),
            parse_mode='Markdown'
        )
        return SHEET_SELECTION

# Handle callback queries for admin approval buttons
async def handle_approval_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    user_id = query.from_user.id
    
    # Check if user is admin
    if not is_admin(user_id):
        await query.edit_message_text(
            "❌ *Access Denied*\n\nOnly administrators can approve transactions.",
            parse_mode='Markdown'
        )
        return
    
    # Parse callback data
    callback_data = query.data
    if callback_data.startswith("approve_"):
        pending_id = callback_data.replace("approve_", "")
        action = "approve"
    elif callback_data.startswith("cancel_"):
        pending_id = callback_data.replace("cancel_", "")
        action = "cancel"
    else:
        await query.edit_message_text("❌ Invalid action.")
        return
    
    # Check if pending transaction exists
    if pending_id not in pending_transactions:
        await query.edit_message_text("❌ Transaction not found or already processed.")
        return
    
    pending_info = pending_transactions[pending_id]
    transaction_data = pending_info['transaction_data']
    user_id_original = pending_info['user_id']
    
    if action == "approve":
        try:
            # 1) Dashboard is the system of record — write there FIRST.
            payload = {
                'phone':      transaction_data['phone'],
                'direction':  DIRECTION_MAP.get(transaction_data['type'], ''),
                'method':     METHOD_MAP.get(transaction_data['method'], ''),
                'place':      PLACE_MAP.get(transaction_data['place'], ''),
                'amount':     transaction_data['amount'],
                'commission': (transaction_data.get('commission') if transaction_data.get('commission') not in (None, '') else None),
                'notes':      (transaction_data.get('notes') or None),
                'status':     'completed',
            }
            api_res = api_client.post_transaction(payload)

            if not api_res.get('ok'):
                # Reject everything (no Sheet write) and keep it pending so the
                # admin can fix the phone and re-approve.
                reason = api_res.get('error', 'Unknown error')
                await query.edit_message_text(
                    "❌ Not saved — still pending.\n\n"
                    f"The dashboard rejected it: {reason}\n\n"
                    "Make sure the phone matches a client, then approve again.",
                    reply_markup=InlineKeyboardMarkup([[
                        InlineKeyboardButton("✅ Accept", callback_data=f"approve_{pending_id}"),
                        InlineKeyboardButton("❌ Cancel", callback_data=f"cancel_{pending_id}")
                    ]])
                )
                return

            data       = api_res.get('data') or {}
            client     = data.get('client') or {}
            activated  = bool(data.get('activated'))
            transaction_data['client_name'] = client.get('name') or transaction_data['phone']

            # 2) Mirror to Google Sheets (the dashboard already has it).
            sheet = init_google_sheets("Transactions")
            record_id = get_next_id(sheet)
            sheet_ok = await save_transaction_to_sheets(transaction_data, record_id)

            # Notify admin (plain text — no escaping needed)
            await query.edit_message_text(
                "✅ Transaction Approved\n\n"
                f"ID: {record_id}\n"
                f"Client: {transaction_data['client_name']}\n"
                f"Amount: {transaction_data['amount']:,.2f} USD\n"
                f"{'🟢 Client activated' + chr(10) if activated else ''}"
                f"{'Saved to dashboard + Google Sheets.' if sheet_ok else '⚠️ Saved to dashboard; Sheet mirror failed.'}"
            )

            # Notify original user
            commission_value = transaction_data.get('commission', '')
            if commission_value in (None, ''):
                commission_text = "None"
            else:
                try:
                    commission_text = f"{float(commission_value):,.2f}"
                except (TypeError, ValueError):
                    commission_text = str(commission_value)
            safe_client = escape_markdown(transaction_data['client_name'])
            safe_notes = escape_markdown(transaction_data.get('notes', 'None') or 'None')
            user_notification = f"""✅ *Transaction Approved\\!*

📋 *Your Transaction Details:*
├─ 🆔 ID: `{record_id}`
├─ 🔄 Type: {escape_markdown(transaction_data['type'])}
├─ 👤 Client: {safe_client}
├─ 💳 Method: {escape_markdown(transaction_data['method'])}
├─ 📍 Place: {escape_markdown(transaction_data['place'])}
├─ 💰 Amount: {transaction_data['amount']:,.2f} USD
├─ 💲 Commission: {commission_text}
├─ 📅 Date: {transaction_data['date']}
└─ 📝 Notes: {safe_notes}

_Saved successfully\\!_"""
            try:
                await context.bot.send_message(
                    chat_id=user_id_original,
                    text=user_notification,
                    parse_mode='Markdown'
                )
            except Exception as e:
                logging.error(f"Error notifying user {user_id_original}: {e}")

            # Generate once and send to submitter + all admins
            invoice_recipients = sorted({user_id_original, *ADMIN_TELEGRAM_IDS})
            try:
                await generate_transaction_invoice_pdf(
                    context.bot,
                    transaction_data,
                    record_id,
                    invoice_recipients,
                )
            except Exception as invoice_error:
                logging.error(f"Error generating/sending invoice PDF: {invoice_error}")

            # Remove from pending transactions
            del pending_transactions[pending_id]
        except Exception as e:
            logging.error(f"Error approving transaction: {e}")
            await query.edit_message_text(
                f"❌ *Error*\n\nFailed to approve transaction: {str(e)[:100]}",
                parse_mode='Markdown'
            )
    
    elif action == "cancel":
        # Notify admin
        safe_full_name = escape_markdown(transaction_data['phone'])
        await query.edit_message_text(
            f"❌ *Transaction Canceled*\n\n"
            f"Transaction has been rejected and will not be saved\\.\n"
            f"Amount: {transaction_data['amount']:,.2f}\n"
            f"Phone: {safe_full_name}",
            parse_mode='Markdown'
        )
        
        # Notify original user
        safe_full_name = escape_markdown(transaction_data['phone'])
        user_notification = f"""❌ *Transaction Canceled*

Your transaction has been canceled by an administrator and will not be saved\\.

📋 *Transaction Details:*
├─ 🔄 Type: {escape_markdown(transaction_data['type'])}
├─ 📱 Phone: {safe_full_name}
├─ 💳 Method: {escape_markdown(transaction_data['method'])}
├─ 📍 Place: {escape_markdown(transaction_data['place'])}
└─ 💰 Amount: {transaction_data['amount']:,.2f}

_If you believe this is an error, please contact an administrator\\._"""
        try:
            await context.bot.send_message(
                chat_id=user_id_original,
                text=user_notification,
                parse_mode='Markdown'
            )
        except Exception as e:
            logging.error(f"Error notifying user {user_id_original}: {e}")
        
        # Remove from pending transactions
        del pending_transactions[pending_id]

# Cancel command
async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data.clear()
    await update.message.reply_text(
        "👋 *Session ended.*\n\nSend any message to begin again.",
        reply_markup=ReplyKeyboardRemove(),
        parse_mode='Markdown'
    )
    return ConversationHandler.END

# Main function