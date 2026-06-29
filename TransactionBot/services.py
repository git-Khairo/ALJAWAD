import logging
import traceback
from telegram import Update, ReplyKeyboardMarkup, ReplyKeyboardRemove
from telegram.ext import ContextTypes
import gspread
from google.oauth2.service_account import Credentials
from datetime import datetime, date
import pytz
import time
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import io
import os
import platform
import urllib.request
import re

# Match any chunk that contains at least one Arabic char
_ARABIC_RUN_RE = re.compile(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+')

# Try to import Arabic text processing libraries
try:
    import arabic_reshaper
    from bidi.algorithm import get_display
    ARABIC_SUPPORT = True
except ImportError:
    ARABIC_SUPPORT = False
    logging.warning("arabic-reshaper or python-bidi not installed. Arabic text may not display correctly.")

from config import (
    SCOPES,
    SERVICE_ACCOUNT_FILE,
    SPREADSHEET_ID,
    ALLOWED_TELEGRAM_IDS,
    ADMIN_TELEGRAM_IDS,
    _sheet_instances,
    TIMEZONE,
    TRANSACTION_TYPE_OPTIONS,
    METHOD_OPTIONS,
    PLACE_OPTIONS,
)

# Global flag to track if fonts are registered
_fonts_registered = False

def init_google_sheets(sheet_name="Transactions"):
    global _sheet_instances

    # Cache key must include BOTH the spreadsheet and the worksheet name
    cache_key = f"{SPREADSHEET_ID}:{sheet_name}"

    if cache_key not in _sheet_instances:
        last_error = None

        for attempt in range(2):  # keep your "retry once" behavior
            try:
                creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
                client = gspread.authorize(creds)
                spreadsheet = client.open_by_key(SPREADSHEET_ID)
                _sheet_instances[cache_key] = spreadsheet.worksheet(sheet_name)
                break
            except Exception as e:
                last_error = e
                logging.error(f"Error initializing Google Sheets ({cache_key}) attempt {attempt + 1}: {e}")
                time.sleep(2)

        if cache_key not in _sheet_instances:
            raise last_error

    return _sheet_instances[cache_key]


# Get next available ID for Transactions sheet (data starts from row 4)
def get_next_id(sheet):
    try:
        ids = sheet.col_values(1)
        if len(ids) <= 3:  # Rows 1-3 are headers, data starts from row 4
            return 1
        data_ids = ids[3:]  # Get IDs from row 4 onwards
        if not data_ids:
            return 1
        numeric_ids = []
        for id_val in data_ids:
            try:
                numeric_ids.append(int(id_val))
            except ValueError:
                continue
        if not numeric_ids:
            return 1
        return max(numeric_ids) + 1
    except Exception as e:
        logging.error(f"Error getting next ID: {e}")
        return 1

# Get full header content from Google Sheets
def get_header_from_sheet(sheet, sheet_type):
    """Get full header content from Google Sheets with formatting info"""
    try:
        # Get header rows based on sheet type
        header_rows = 2  # Rows 1-2
        
        # Read header rows - get more columns to capture all header content
        header_data = sheet.get(f'A1:Z{header_rows}')
        
        # Try to get formatting information using Google Sheets API
        header_with_formatting = []
        try:
            creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
            from googleapiclient.discovery import build
            service = build('sheets', 'v4', credentials=creds)
            
            # Get sheet with formatting data
            request = service.spreadsheets().get(
                spreadsheetId=SPREADSHEET_ID,
                ranges=[f"{sheet.title}!A1:Z{header_rows}"],
                includeGridData=True
            )
            spreadsheet = request.execute()
            
            # Find the sheet
            for sheet_item in spreadsheet.get('sheets', []):
                if sheet_item['properties']['title'] == sheet.title:
                    if 'data' in sheet_item and len(sheet_item['data']) > 0:
                        grid_data = sheet_item['data'][0]
                        row_data = grid_data.get('rowData', [])
                        
                        for row_idx, row in enumerate(row_data):
                            row_info = []
                            if 'values' in row:
                                for col_idx, cell in enumerate(row['values']):
                                    cell_info = {
                                        'value': '',
                                        'font_size': 10,
                                        'bold': False,
                                        'color': colors.black,
                                        'bg_color': None
                                    }
                                    
                                    # Get cell value - prefer effectiveValue (calculated result) over userEnteredValue (formula)
                                    if 'effectiveValue' in cell:
                                        # Use effectiveValue to get the calculated result of formulas
                                        if 'stringValue' in cell['effectiveValue']:
                                            cell_info['value'] = cell['effectiveValue']['stringValue']
                                        elif 'numberValue' in cell['effectiveValue']:
                                            cell_info['value'] = str(cell['effectiveValue']['numberValue'])
                                        elif 'boolValue' in cell['effectiveValue']:
                                            cell_info['value'] = str(cell['effectiveValue']['boolValue'])
                                    elif 'userEnteredValue' in cell:
                                        # Fallback to userEnteredValue if effectiveValue not available
                                        if 'stringValue' in cell['userEnteredValue']:
                                            cell_info['value'] = cell['userEnteredValue']['stringValue']
                                        elif 'numberValue' in cell['userEnteredValue']:
                                            cell_info['value'] = str(cell['userEnteredValue']['numberValue'])
                                        elif 'formulaValue' in cell['userEnteredValue']:
                                            # If it's a formula, try to get the calculated value from effectiveValue
                                            # Otherwise, we'll skip formulas in header
                                            pass
                                    
                                    # Get formatting
                                    if 'userEnteredFormat' in cell:
                                        fmt = cell['userEnteredFormat']
                                        
                                        # Font info
                                        if 'textFormat' in fmt:
                                            tf = fmt['textFormat']
                                            if 'fontSize' in tf:
                                                cell_info['font_size'] = tf['fontSize']
                                            if 'bold' in tf:
                                                cell_info['bold'] = tf['bold']
                                            if 'foregroundColor' in tf:
                                                color = tf['foregroundColor']
                                                if 'red' in color and 'green' in color and 'blue' in color:
                                                    cell_info['color'] = colors.HexColor(
                                                        f"#{int(color.get('red', 0) * 255):02x}"
                                                        f"{int(color.get('green', 0) * 255):02x}"
                                                        f"{int(color.get('blue', 0) * 255):02x}"
                                                    )
                                        
                                        # Background color
                                        if 'backgroundColor' in fmt:
                                            bg = fmt['backgroundColor']
                                            if 'red' in bg and 'green' in bg and 'blue' in bg:
                                                cell_info['bg_color'] = colors.HexColor(
                                                    f"#{int(bg.get('red', 0) * 255):02x}"
                                                    f"{int(bg.get('green', 0) * 255):02x}"
                                                    f"{int(bg.get('blue', 0) * 255):02x}"
                                                )
                                    
                                    row_info.append(cell_info)
                            header_with_formatting.append(row_info)
                    break
        except Exception as format_error:
            logging.warning(f"Could not get formatting info: {format_error}")
            # Fallback to plain text
            header_with_formatting = None
        
        # If we couldn't get formatting, use plain data (but still get calculated values)
        if not header_with_formatting:
            header_with_formatting = []
            # Use gspread's get method which returns calculated values, not formulas
            try:
                all_header_values = sheet.get(f'A1:Z{header_rows}')
                for row in all_header_values:
                    row_info = []
                    for cell in row:
                        row_info.append({
                            'value': str(cell) if cell else '',
                            'font_size': 10,
                            'bold': False,
                            'color': colors.black,
                            'bg_color': None
                        })
                    header_with_formatting.append(row_info)
            except:
                # Final fallback
                for row in header_data:
                    row_info = []
                    for cell in row:
                        row_info.append({
                            'value': str(cell) if cell else '',
                            'font_size': 10,
                            'bold': False,
                            'color': colors.black,
                            'bg_color': None
                        })
                    header_with_formatting.append(row_info)
        
        return header_with_formatting
        
    except Exception as e:
        logging.error(f"Error getting header from sheet: {e}")
        return []

# Extract company name and logo from Google Sheets header (kept for backward compatibility)
def get_company_info_from_sheet(sheet, sheet_type):
    """Extract company name and logo URL from Google Sheets header"""
    company_name = None
    logo_url = None
    
    try:
        # Get header rows based on sheet type
        header_rows = 2
        
        # Read header rows - get more columns to be safe
        header_data = sheet.get(f'A1:Z{header_rows}')
        
        # Column headers to exclude (these are not company names)
        excluded_headers = ['ID', 'TYPE', 'NAME', 'METHOD', 'AMOUNT', 'PLACE', 'COMMISSION', 'DATE', 'NOTES',
                          'TELEGRAM ID', 'TELEGRAM NAME', 'DESCRIPTION', 'TYPE', 'DATE', 'DESCRIPTION',
                          'قبض', 'دفع', 'ID', 'DATE', 'TYPE', 'DESCRIPTION', 'AMOUNT']
        
        # Try to find company name in header rows
        # Usually in first row, first few columns
        for row_idx, row in enumerate(header_data[:min(5, len(header_data))]):  # Check first 5 rows max
            for col_idx, cell in enumerate(row[:10]):  # Check first 10 columns
                if cell and str(cell).strip():
                    cell_value = str(cell).strip()
                    # Check if it looks like a company name
                    # - Not empty
                    # - Reasonable length (2-100 chars)
                    # - Not a number
                    # - Not a column header
                    # - Usually in first row or first column
                    if (len(cell_value) > 2 and len(cell_value) < 100 and 
                        not cell_value.replace('.', '').replace(',', '').replace('-', '').isdigit() and
                        cell_value.upper() not in [h.upper() for h in excluded_headers]):
                        
                        # Prefer first row, first column for company name
                        if row_idx == 0 and col_idx == 0:
                            company_name = cell_value
                            break
                        # Or if we haven't found one yet, use this
                        elif not company_name:
                            company_name = cell_value
            if company_name:
                break
        
        # Check if logo URL is stored as text in header cells
        for row_idx, row in enumerate(header_data[:min(5, len(header_data))], start=1):
            for col_idx, cell in enumerate(row, start=1):
                if cell:
                    cell_str = str(cell).strip()
                    cell_lower = cell_str.lower()
                    
                    # Check if it's a direct URL to an image
                    if cell_str.startswith('http') and any(ext in cell_lower for ext in ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']):
                        logo_url = cell_str
                        break
                    
                    # Check if cell contains "logo" keyword with URL
                    if 'logo' in cell_lower and 'http' in cell_lower:
                        # Extract URL using regex
                        import re
                        urls = re.findall(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', cell_str)
                        if urls:
                            logo_url = urls[0]
                            break
            if logo_url:
                break
        
        # Try to get embedded images from Google Sheets using API
        # This is more complex and requires additional API calls
        try:
            creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
            from googleapiclient.discovery import build
            service = build('sheets', 'v4', credentials=creds)
            
            # Get sheet with images (requires includeGridData=True for images)
            request = service.spreadsheets().get(
                spreadsheetId=SPREADSHEET_ID,
                ranges=[f"{sheet.title}!A1:Z{header_rows}"],
                includeGridData=True
            )
            spreadsheet = request.execute()
            
            # Find the sheet
            for sheet_item in spreadsheet.get('sheets', []):
                if sheet_item['properties']['title'] == sheet.title:
                    # Check for images in the grid data
                    if 'data' in sheet_item and len(sheet_item['data']) > 0:
                        row_data = sheet_item['data'][0].get('rowData', [])
                        for row_idx, row in enumerate(row_data[:min(3, len(row_data))]):
                            if 'values' in row:
                                for col_idx, cell in enumerate(row['values'][:10]):
                                    # Check if cell has an image
                                    if 'userEnteredValue' not in cell and 'image' in str(cell):
                                        # Image found, but extracting it requires more complex handling
                                        # For now, we'll rely on URL in cells
                                        pass
                    break
        except Exception as img_error:
            # This is expected if images aren't accessible or API doesn't support it
            logging.debug(f"Could not retrieve embedded images from Google Sheets: {img_error}")
        
    except Exception as e:
        logging.error(f"Error extracting company info from sheet: {e}")
    
    # Fallback to default if not found
    if not company_name:
        company_name = "Company"  # Default fallback
    
    return company_name, logo_url

# Check if user is allowed to access the bot
def is_user_allowed(user_id):
    return user_id in ALLOWED_TELEGRAM_IDS

# Check if user is admin
def is_admin(user_id):
    return user_id in ADMIN_TELEGRAM_IDS

# Escape Markdown special characters (MarkdownV2 style)
def escape_markdown(text):
    """Escape special Markdown characters to prevent parsing errors"""
    if not text:
        return ""
    # Characters that need escaping in Markdown (Telegram Markdown)
    # We only escape the ones that cause issues in inline formatting
    escaped_text = str(text)
    # Escape backslashes first
    escaped_text = escaped_text.replace('\\', '\\\\')
    # Escape characters that can break Markdown formatting
    special_chars = ['_', '*', '[', ']', '(', ')', '~', '`']
    for char in special_chars:
        escaped_text = escaped_text.replace(char, f'\\{char}')
    return escaped_text

# Main menu keyboard - Shows sheet selection
def get_main_menu_keyboard(user_id):
    keyboard = [
        ['💼 Transactions'],
        ['❌ Cancel']
    ]
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=True)

# Sheet selection menu keyboard
def get_sheet_menu_keyboard(user_id, sheet_type):
    if sheet_type == "Transactions":
        if is_admin(user_id):
            keyboard = [
                ['📥 Add Transaction', '🗑️ Delete Transaction'],
                ['🔙 Back to Main Menu']
            ]
        else:
            keyboard = [
                ['📥 Add Transaction'],
                ['🔙 Back to Main Menu']
            ]
    else:
        keyboard = [['🔙 Back to Main Menu']]
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=True)

# Type selection keyboard for Transactions
def get_type_keyboard():
    keyboard = []
    row = []
    for option in TRANSACTION_TYPE_OPTIONS:
        row.append(f"🔹 {option}")
        if len(row) == 2:
            keyboard.append(row)
            row = []
    if row:
        keyboard.append(row)
    keyboard.append(['🔙 Back to Main Menu'])
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=True)

# Method selection keyboard
def get_method_keyboard():
    keyboard = []
    row = []
    for option in METHOD_OPTIONS:
        row.append(f"💳 {option}")
        if len(row) == 2:
            keyboard.append(row)
            row = []
    if row:
        keyboard.append(row)
    keyboard.append(['🔙 Back to Main Menu'])
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=True)

def get_place_keyboard():
    keyboard = []
    row = []
    for option in PLACE_OPTIONS:
        row.append(f"📍 {option}")
        if len(row) == 2:
            keyboard.append(row)
            row = []
    if row:
        keyboard.append(row)
    keyboard.append(['🔙 Back to Main Menu'])
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=True)

# Commission keyboard
def get_commission_keyboard():
    keyboard = [
        ['💲 Add Commission', '⏩ Skip Commission'],
        ['🔙 Back to Main Menu']
    ]
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=True)

# Notes keyboard
def get_notes_keyboard():
    keyboard = [
        ['📝 Add Notes', '⏩ Skip Notes'],
        ['🔙 Back to Main Menu']
    ]
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=True)

# Global flag to track if fonts are registered
_fonts_registered = False

# Check if text contains Arabic characters
def contains_arabic(text):
    """Check if text contains Arabic characters"""
    if not text:
        return False
    arabic_pattern = re.compile(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]')
    return bool(arabic_pattern.search(str(text)))

def process_arabic_text(text: str) -> str:
    """
    - English only -> return as-is
    - Arabic only -> reshape + bidi
    - Mixed Arabic+English -> apply reshape+bidi ONLY to Arabic runs, keep English untouched
    """
    if text is None:
        return ""

    text_str = str(text)

    # If no Arabic, keep as-is (this fixes type/method showing issues)
    if not contains_arabic(text_str):
        return text_str

    # If libs not available, return original
    if not ARABIC_SUPPORT:
        logging.warning("Arabic reshaper not available; returning original text.")
        return text_str

    try:
        # Process each Arabic chunk individually so English remains stable
        def _fix_arabic_chunk(m):
            chunk = m.group(0)
            reshaped = arabic_reshaper.reshape(chunk)
            return get_display(reshaped)

        return _ARABIC_RUN_RE.sub(_fix_arabic_chunk, text_str)

    except Exception as e:
        logging.warning(f"Error processing Arabic text: {e}. Returning original text.")
        return text_str

# Verify Arabic font is working
def verify_arabic_font(font_name):
    """Verify that the Arabic font can actually render Arabic text"""
    try:
        if font_name not in pdfmetrics.getRegisteredFontNames():
            return False
        
        # Try to create a simple paragraph with Arabic text
        test_text = "ا"
        try:
            # Paragraph and ParagraphStyle are already imported at module level
            test_style = ParagraphStyle('Test', fontName=font_name, fontSize=12)
            test_para = Paragraph(test_text, test_style)
            return True
        except Exception:
            return False
    except Exception:
        return False

# Register Arabic-supporting font
def register_arabic_font():
    """Register a font that supports Arabic characters"""
    global _fonts_registered
    
    # Check if fonts are already registered
    try:
        registered_fonts = pdfmetrics.getRegisteredFontNames()
        if 'ArabicFont' in registered_fonts:
            _fonts_registered = True
            return 'ArabicFont'
    except:
        pass
    
    try:
        # Try to find and register fonts with good Arabic support
        system = platform.system()
        logging.info(f"Detected system: {system}, checking for Arabic fonts...")
        
        if system == 'Windows':
            font_paths = [
                (r'C:\Windows\Fonts\ARIALUNI.TTF', r'C:\Windows\Fonts\ARIALUNI.TTF'),  # Arial Unicode MS (best Arabic support)
                (r'C:\Windows\Fonts\Tahoma.ttf', r'C:\Windows\Fonts\Tahomabd.ttf'),  # Tahoma (good Arabic support)
                (r'C:\Windows\Fonts\segoeui.ttf', r'C:\Windows\Fonts\segoeuib.ttf'),  # Segoe UI (modern, good Arabic)
                (r'C:\Windows\Fonts\arial.ttf', r'C:\Windows\Fonts\arialbd.ttf'),  # Arial regular and bold
            ]
        elif system == 'Darwin':  # macOS
            font_paths = [
                # Arial Unicode (comprehensive Unicode support - BEST for ReportLab)
                ('/System/Library/Fonts/Supplemental/Arial Unicode.ttf', '/System/Library/Fonts/Supplemental/Arial Unicode.ttf'),
                ('/Library/Fonts/Arial Unicode.ttf', '/Library/Fonts/Arial Unicode.ttf'),
                # Tahoma (good Arabic support)
                ('/System/Library/Fonts/Supplemental/Tahoma.ttf', '/System/Library/Fonts/Supplemental/Tahoma Bold.ttf'),
                # SF Arabic fonts (native macOS Arabic fonts - may not work well with ReportLab)
                ('/System/Library/Fonts/SFArabic.ttf', '/System/Library/Fonts/SFArabic.ttf'),
                ('/System/Library/Fonts/SFArabicRounded.ttf', '/System/Library/Fonts/SFArabicRounded.ttf'),
                # Arial (fallback - limited Arabic support)
                ('/System/Library/Fonts/Supplemental/Arial.ttf', '/System/Library/Fonts/Supplemental/Arial Bold.ttf'),
            ]
        else:  # Linux (including Docker containers)
            font_paths = [
                # Noto fonts (best Arabic support) - installed via apt
                ('/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf', '/usr/share/fonts/truetype/noto/NotoSansArabic-Bold.ttf'),
                ('/usr/share/fonts/opentype/noto/NotoSansArabic-Regular.otf', '/usr/share/fonts/opentype/noto/NotoSansArabic-Bold.otf'),
                # DejaVu fonts (good Unicode support including Arabic)
                ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'),
                # Liberation fonts
                ('/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'),
                # Alternative locations
                ('/usr/share/fonts/TTF/DejaVuSans.ttf', '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf'),
                ('/usr/share/fonts/TTF/LiberationSans-Regular.ttf', '/usr/share/fonts/TTF/LiberationSans-Bold.ttf'),
                ('/usr/share/fonts/TTF/NotoSansArabic-Regular.ttf', '/usr/share/fonts/TTF/NotoSansArabic-Bold.ttf'),
                # Docker/container friendly paths
                ('/app/fonts/NotoSansArabic-Regular.ttf', '/app/fonts/NotoSansArabic-Bold.ttf'),
                ('/app/fonts/DejaVuSans.ttf', '/app/fonts/DejaVuSans-Bold.ttf'),
            ]
        
        # Log all paths being checked for debugging
        logging.info(f"Checking {len(font_paths)} font path(s) for Arabic support...")
        
        for regular_path, bold_path in font_paths:
            logging.debug(f"Checking font path: {regular_path}")
            if os.path.exists(regular_path):
                try:
                    # Only register if not already registered
                    if 'ArabicFont' not in pdfmetrics.getRegisteredFontNames():
                        # Register font - ensure it's embedded properly
                        try:
                            # Use absolute path to ensure font file is found
                            abs_path = os.path.abspath(regular_path)
                            if not os.path.exists(abs_path):
                                raise FileNotFoundError(f"Font file not found: {abs_path}")
                            
                            font_obj = TTFont('ArabicFont', abs_path)
                            # Register the font
                            pdfmetrics.registerFont(font_obj)
                            logging.info(f"Arabic font registered successfully: {abs_path}")
                            
                            # Verify the font can be retrieved and used
                            test_font = pdfmetrics.getFont('ArabicFont')
                            if test_font:
                                logging.info(f"Font verification: ArabicFont is accessible")
                            else:
                                logging.warning(f"Font verification failed: ArabicFont registered but not accessible")
                        except Exception as reg_error:
                            logging.error(f"Failed to register font {regular_path}: {reg_error}")
                            logging.error(f"Error details: {traceback.format_exc()}")
                            raise
                    # Try to register bold font, fallback to regular if not found
                    if 'ArabicFontBold' not in pdfmetrics.getRegisteredFontNames():
                        if os.path.exists(bold_path) and bold_path != regular_path:
                            try:
                                abs_bold_path = os.path.abspath(bold_path)
                                pdfmetrics.registerFont(TTFont('ArabicFontBold', abs_bold_path))
                                logging.info(f"Arabic bold font registered: {abs_bold_path}")
                            except Exception as bold_error:
                                logging.warning(f"Failed to register bold font {bold_path}, using regular: {bold_error}")
                                abs_regular_path = os.path.abspath(regular_path)
                                pdfmetrics.registerFont(TTFont('ArabicFontBold', abs_regular_path))
                        else:
                            abs_regular_path = os.path.abspath(regular_path)
                            pdfmetrics.registerFont(TTFont('ArabicFontBold', abs_regular_path))
                            logging.info(f"Arabic bold font registered (using regular): {abs_regular_path}")
                    _fonts_registered = True
                    logging.info(f"Successfully registered Arabic fonts from: {regular_path}")
                    return 'ArabicFont'
                except Exception as e:
                    logging.warning(f"Failed to register font {regular_path}: {e}")
                    logging.warning(f"Error details: {traceback.format_exc()}")
                    continue
        
        # Fallback: Try to download a free Arabic font or use built-in
        logging.warning(f"No Arabic font found in any of the checked paths. System: {system}")
        logging.warning("Attempting to use built-in fonts (may not support Arabic well)")
        
        # Try to use DejaVu Sans which sometimes has limited Arabic support
        # If that fails, we'll have to use Helvetica which definitely won't work
        try:
            # Check if we can at least register a basic font
            registered = pdfmetrics.getRegisteredFontNames()
            if 'Helvetica' in registered:
                logging.warning("Using Helvetica (will NOT display Arabic correctly - black squares expected)")
                return 'Helvetica'
            else:
                # Helvetica should be built-in, but if not, try to use default
                logging.error("No fonts available at all!")
                return 'Helvetica'  # ReportLab should have this built-in
        except Exception as e:
            logging.error(f"Error in fallback font selection: {e}")
            return 'Helvetica'
    except Exception as e:
        logging.error(f"Error registering Arabic font: {e}")
        return 'Helvetica'

# Generate PDF from sheet data
def parse_date_from_string(date_str: str) -> date:
    """
    Parse date from string in various formats
    Supports: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD.MM.YYYY
    """
    date_str = str(date_str).strip()
    
    # Try different formats
    formats = [
        "%d/%m/%Y",  # DD/MM/YYYY
        "%d-%m-%Y",  # DD-MM-YYYY
        "%Y-%m-%d",  # YYYY-MM-DD
        "%d.%m.%Y",  # DD.MM.YYYY
        "%d/%m/%y",  # DD/MM/YY
        "%d-%m-%y",  # DD-MM-YY
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    
    # If all formats fail, return None
    return None

def pick_value_style(text: str, ar_style, en_style):
    return ar_style if contains_arabic(str(text)) else en_style

def pick_style(value, ar_style, en_style):
    return ar_style if contains_arabic(str(value)) else en_style


async def generate_transaction_invoice_pdf(bot, transaction_data: dict, record_id: int, chat_ids):
    """Build one PDF and send it to each chat. `chat_ids` may be a single int or an iterable of user/chat IDs."""
    if isinstance(chat_ids, int):
        chat_ids = [chat_ids]
    else:
        chat_ids = list(chat_ids)
    try:
        # Register Arabic font
        arabic_font = register_arabic_font()
        arabic_font_bold = 'ArabicFontBold' if arabic_font == 'ArabicFont' else 'Helvetica-Bold'
        
        # Get company info from Google Sheets
        company_name = "Aljawad Trading"
        logo_url = 'Logo.png'
        
        # Create PDF in memory
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.6*inch, rightMargin=0.5*inch, leftMargin=0.5*inch, bottomMargin=0.5*inch)
        
        # Create styles
        styles = getSampleStyleSheet()
        
        # Header title style (for company name)
        header_style = ParagraphStyle(
            'InvoiceHeader',
            parent=styles['Heading1'],
            fontSize=22,
            spaceAfter=10,
            spaceBefore=5,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#1A1A1A'),
            fontName=arabic_font_bold,
            leading=26
        )
        
        # Invoice title style
        title_style = ParagraphStyle(
            'InvoiceTitle',
            parent=styles['Heading2'],
            fontSize=16,
            spaceAfter=25,
            spaceBefore=15,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#2C3E50'),
            fontName=arabic_font_bold,
            leading=20
        )
        
        # Section header style
        section_style = ParagraphStyle(
            'InvoiceSection',
            parent=styles['Normal'],
            fontSize=11,
            fontName=arabic_font_bold,
            leading=13,
            textColor=colors.HexColor('#34495E'),
            spaceAfter=8,
            spaceBefore=15
        )
        
        # Label style with icon prefix
        label_style = ParagraphStyle(
            'InvoiceLabel',
            parent=styles['Normal'],
            fontSize=10,
            fontName=arabic_font_bold,
            leading=14,
            textColor=colors.HexColor('#34495E')
        )
        
        # Value style
        value_style = ParagraphStyle(
            'InvoiceValue',
            parent=styles['Normal'],
            fontSize=10,
            fontName=arabic_font,
            leading=14,
            textColor=colors.HexColor('#1A1A1A')
        )

        # English/Latin value style (fallback)
        value_style_en = ParagraphStyle(
            'InvoiceValueEN',
            parent=styles['Normal'],
            fontSize=10,
            fontName='Helvetica',   # or 'Times-Roman'
            leading=14,
            textColor=colors.HexColor('#1A1A1A')
        )
        
        # Create story (content)
        story = []
        
        # Logo image at the top (if available)
        if logo_url:
            try:
                # Check if logo_url is a URL or local file path
                if logo_url.startswith('http://') or logo_url.startswith('https://'):
                    # Download logo image from URL
                    logo_response = urllib.request.urlopen(logo_url, timeout=10)
                    logo_data = logo_response.read()
                    logo_response.close()
                    logo_image = Image(io.BytesIO(logo_data))
                else:
                    # Local file path
                    if os.path.exists(logo_url):
                        logo_image = Image(
                            logo_url,
                            width=1.2 * inch,     # adjust as needed (try 1.0–1.4)
                            height=0.4 * inch     # keeps logo slim
                        )
                        logo_image.hAlign = 'CENTER'
                    elif os.path.exists(os.path.join(os.getcwd(), logo_url)):
                        # Try current directory
                        logo_image = Image(os.path.join(os.getcwd(), logo_url))
                    else:
                        raise FileNotFoundError(f"Logo file not found: {logo_url}")
                
                
                # Center the logo
                logo_image.hAlign = 'CENTER'
                
                story.append(logo_image)
                story.append(Spacer(1, 0.2*inch))
            except Exception as logo_error:
                logging.warning(f"Could not load logo from URL {logo_url}: {logo_error}")
                # Continue without logo if it fails to load
        
        # Company name header with better styling
        if company_name:
            company_para = Paragraph(process_arabic_text(company_name), header_style)
            story.append(company_para)
            story.append(Spacer(1, 0.15*inch))
            story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#3498DB'), spaceAfter=0.2*inch))
        
        # Invoice title with better styling
        invoice_title = Paragraph(process_arabic_text("معاملة / INVOICE"), title_style)
        story.append(invoice_title)
        
        # Invoice details section
        section_header = Paragraph(process_arabic_text("<b>تفاصيل المعاملة</b>"), section_style)
        story.append(section_header)
        
        # Transaction details table with prefixes
        invoice_data = []
        
        # Invoice Number with prefix
        invoice_data.append([
            Paragraph(process_arabic_text("<b>🆔 رقم المعاملة:</b>"), label_style),
            Paragraph(process_arabic_text(str(record_id)), pick_value_style(str(record_id),value_style,value_style_en))
        ])
        
        # Transaction Type with prefix
        transaction_type = str(transaction_data.get('type', 'N/A'))
        invoice_data.append([
            Paragraph(process_arabic_text("<b>🔄 نوع المعاملة:</b>"), label_style),
            Paragraph(process_arabic_text(transaction_type), pick_value_style(transaction_type,value_style,value_style_en))
        ])
        
        # Customer name (resolved from the dashboard), falling back to phone
        customer_name = str(transaction_data.get('client_name') or transaction_data.get('phone', 'N/A'))
        invoice_data.append([
            Paragraph(process_arabic_text("<b>👤 اسم العميل:</b>"), label_style),
            Paragraph(process_arabic_text(customer_name), pick_value_style(customer_name,value_style,value_style_en))
        ])
        
        # Payment Method with prefix
        payment_method = str(transaction_data.get('method', 'N/A'))
        invoice_data.append([
            Paragraph(process_arabic_text("<b>💳 طريقة الدفع:</b>"), label_style),
            Paragraph(process_arabic_text(payment_method), pick_value_style(payment_method,value_style,value_style_en))
        ])

        # Place with prefix
        place_value = str(transaction_data.get('place', 'N/A'))
        invoice_data.append([
            Paragraph(process_arabic_text("<b>📍 المكان:</b>"), label_style),
            Paragraph(process_arabic_text(place_value), pick_value_style(place_value, value_style, value_style_en))
        ])
        
        # Date with prefix
        transaction_date = str(transaction_data.get('date', 'N/A'))
        invoice_data.append([
            Paragraph(process_arabic_text("<b>📅 تاريخ المعاملة:</b>"), label_style),
            Paragraph(process_arabic_text(transaction_date), pick_value_style(transaction_date,value_style,value_style_en))
        ])
        
        # Create transaction details table
        details_table = Table(invoice_data, colWidths=[2.8*inch, 3.7*inch])
        details_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (0, -1), 10),
            ('RIGHTPADDING', (0, 0), (0, -1), 8),
            ('LEFTPADDING', (1, 0), (1, -1), 10),
            ('RIGHTPADDING', (1, 0), (1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#ECF0F1')),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FAFAFA')),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#F8F9FA')]),
        ]))
        
        story.append(details_table)
        story.append(Spacer(1, 0.25*inch))
        
        # Amount section header
        amount_section = Paragraph(process_arabic_text("<b>ملخص الدفع</b>"), section_style)
        story.append(amount_section)
        
        # Calculate amounts (commission may be '' when skipped — float('') raises)
        def _invoice_num(value, default=0.0):
            if value in (None, ''):
                return default
            try:
                return float(value)
            except (TypeError, ValueError):
                return default

        amount = _invoice_num(transaction_data.get('amount'), 0)
        commission = _invoice_num(transaction_data.get('commission'), 0)
        
        # Amount row with prefix
        amount_data = [
            [Paragraph(process_arabic_text("<b>💰 مبلغ المعاملة:</b>"), label_style),
             Paragraph(process_arabic_text(f"{amount:,.2f}"), pick_value_style(f"{amount:,.2f}",value_style,value_style_en))]
        ]
        
        # Commission row (if exists) with prefix
        if commission > 0:
            amount_data.append([
                Paragraph(process_arabic_text("<b>💲 العمولة:</b>"), label_style),
                Paragraph(process_arabic_text(f"{commission:,.2f}"), pick_value_style(f"{commission:,.2f}",value_style,value_style_en))
            ])
        
        # Create amount table with better styling
        amount_table = Table(amount_data, colWidths=[2.8*inch, 3.7*inch])
        amount_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (0, -1), 12),
            ('RIGHTPADDING', (0, 0), (0, -1), 10),
            ('LEFTPADDING', (1, 0), (1, -1), 12),
            ('RIGHTPADDING', (1, 0), (1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -2), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -2), 10),
            ('TOPPADDING', (0, -1), (-1, -1), 12),
            ('BOTTOMPADDING', (0, -1), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -2), 0.5, colors.HexColor('#ECF0F1')),
            ('LINEBELOW', (0, -2), (-1, -2), 1.5, colors.HexColor('#BDC3C7')),
            ('BACKGROUND', (0, 0), (-1, -2), colors.HexColor('#FAFAFA')),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#F0F8F5')),  # Light green for total
            ('ROWBACKGROUNDS', (0, 0), (-1, -2), [colors.white, colors.HexColor('#F8F9FA')]),
        ]))
        
        story.append(amount_table)
        
        # Notes (if exists) with prefix
        notes = transaction_data.get('notes', '')
        if notes and str(notes).strip():
            story.append(Spacer(1, 0.25*inch))
            notes_section = Paragraph(process_arabic_text("<b>📝 Additional Notes</b>"), section_style)
            story.append(notes_section)
            
            notes_data = [[
                Paragraph(process_arabic_text(str(notes)), ParagraphStyle(
                    'InvoiceNotes',
                    parent=styles['Normal'],
                    fontSize=10,
                    fontName=arabic_font,
                    leading=14,
                    textColor=colors.HexColor('#1A1A1A')
                ))]
            ]
            
            notes_table = Table(notes_data, colWidths=[6.5*inch])
            notes_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 12),
                ('RIGHTPADDING', (0, 0), (-1, -1), 12),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FFF9E6')),  # Light yellow
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#F39C12')),
            ]))
            
            story.append(notes_table)
        
        story.append(Spacer(1, 0.3*inch))
        
        # Footer
        egypt_tz = pytz.timezone(TIMEZONE)
        generated_date = datetime.now(egypt_tz).strftime("%Y-%m-%d %H:%M:%S")
        footer_text = Paragraph(
            process_arabic_text(f"<i>Generated on: {generated_date}</i>"),
            ParagraphStyle(
                'InvoiceFooter',
                parent=styles['Normal'],
                fontSize=8,
                fontName=arabic_font,
                alignment=TA_CENTER,
                textColor=colors.HexColor('#7F8C8D')
            )
        )
        story.append(footer_text)
        
        # Build PDF
        doc.build(story)
        
        # Get PDF data
        pdf_data = buffer.getvalue()
        buffer.close()

        filename = f"Invoice_{record_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        for chat_id in chat_ids:
            try:
                await bot.send_document(
                    chat_id=chat_id,
                    document=io.BytesIO(pdf_data),
                    filename=filename,
                    caption=f"📄 *Invoice # {record_id}*\n\nYour transaction invoice has been generated.",
                    parse_mode='Markdown'
                )
            except Exception as send_err:
                logging.error(f"Failed to send invoice PDF to chat_id={chat_id}: {send_err}")

        logging.info(f"Invoice PDF generated for transaction ID {record_id}; delivery attempted to chats: {chat_ids}")
        
    except Exception as e:
        error_traceback = traceback.format_exc()
        logging.error(f"Error generating invoice PDF for transaction {record_id}: {e}")
        logging.error(f"Full traceback:\n{error_traceback}")


# Access denied message
async def send_access_denied(update: Update):
    # Handle both regular messages and callback queries
    if update.message:
        message = update.message
    elif update.callback_query and update.callback_query.message:
        message = update.callback_query.message
    elif update.effective_message:
        message = update.effective_message
    else:
        # Can't send message if no message object available
        logging.error("send_access_denied: No message object available")
        return
    
    await message.reply_text(
        "🚫 *Access Denied*\n\nSorry, you are not authorized to use this bot. "
        "Please contact the administrator if you believe this is an error.",
        parse_mode='Markdown',
        reply_markup=ReplyKeyboardRemove()
    )