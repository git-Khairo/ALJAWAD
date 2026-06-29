import logging
from telegram.ext import Application, CommandHandler, MessageHandler, filters, CallbackQueryHandler, ConversationHandler

from config import ADMIN_TELEGRAM_IDS, ALLOWED_TELEGRAM_IDS, BOT_TOKEN
from handlers import (
    start, handle_any_message, handle_main_menu, handle_sheet_selection,
    type_handler, phone_handler, method_handler, place_handler,
    amount_handler, commission_handler, notes_handler, delete_record_handler,
    handle_approval_callback, cancel,
    MAIN_MENU, SHEET_SELECTION, TYPE, PHONE, METHOD, PLACE, AMOUNT, COMMISSION,
    NOTES, DELETE_CONFIRM
)

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

def main():
    if not BOT_TOKEN:
        raise SystemExit("BOT_TOKEN is not set — add it to the .env file.")

    application = Application.builder().token(BOT_TOKEN).build()

    # Conversation handler
    conv_handler = ConversationHandler(
        entry_points=[
            CommandHandler('start', start),
            MessageHandler(filters.TEXT & ~filters.COMMAND, handle_any_message)
        ],
        states={
            MAIN_MENU: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_main_menu)],
            SHEET_SELECTION: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_sheet_selection)],
            # Transactions flow
            TYPE: [MessageHandler(filters.TEXT & ~filters.COMMAND, type_handler)],
            PHONE: [MessageHandler(filters.TEXT & ~filters.COMMAND, phone_handler)],
            METHOD: [MessageHandler(filters.TEXT & ~filters.COMMAND, method_handler)],
            PLACE: [MessageHandler(filters.TEXT & ~filters.COMMAND, place_handler)],
            AMOUNT: [MessageHandler(filters.TEXT & ~filters.COMMAND, amount_handler)],
            COMMISSION: [MessageHandler(filters.TEXT & ~filters.COMMAND, commission_handler)],
            NOTES: [MessageHandler(filters.TEXT & ~filters.COMMAND, notes_handler)],
            DELETE_CONFIRM: [MessageHandler(filters.TEXT & ~filters.COMMAND, delete_record_handler)],
        },
        fallbacks=[CommandHandler('cancel', cancel)]
    )

    application.add_handler(conv_handler)

    # Add callback query handler for admin approval buttons
    application.add_handler(CallbackQueryHandler(handle_approval_callback))

    # Start the bot
    print("🤖 TransactionBot running (Admin Approval + dashboard sync)...")
    print(f"👑 Admin Users: {ADMIN_TELEGRAM_IDS}")
    print(f"👥 Allowed Users: {ALLOWED_TELEGRAM_IDS}")
    application.run_polling()

if __name__ == '__main__':
    main()
