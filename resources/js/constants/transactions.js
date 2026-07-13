// Mirror of config/transactions.php (canonical) and TransactionBot/config.py.
// Keep the three in sync when changing options.

export const TX_DIRECTIONS = [
  { value: 'deposit',       ar: 'إيداع',      en: 'Deposit' },
  { value: 'withdrawal',    ar: 'سحب',        en: 'Withdrawal' },
  { value: 'wallet_charge', ar: 'شحن محفظة',  en: 'Wallet Charge' },
  { value: 'wallet_discharge', ar: 'خصم محفظة', en: 'Wallet Discharge' },
  { value: 'close_debt',    ar: 'تسديد دين',  en: 'Close Debt' },
];

export const TX_METHODS = [
  { value: 'cash',      ar: 'نقد',      en: 'Cash' },
  { value: 'usdt',      ar: 'USDT',     en: 'USDT' },
  { value: 'sham_cash', ar: 'شام كاش',  en: 'Sham Cash' },
];

export const TX_PLACES = [
  { value: 'damascus', ar: 'دمشق',   en: 'Damascus' },
  { value: 'tartus',   ar: 'طرطوس',  en: 'Tartus' },
];

export const TX_CURRENCY = 'USD';

// Phone format: starts with 0, exactly 10 digits.
export const TX_PHONE_REGEX = /^0\d{9}$/;

const pick = (list, v, lang) => {
  const item = list.find(x => x.value === v);
  return item ? (lang === 'ar' ? item.ar : item.en) : (v ?? '');
};
export const txDirectionLabel = (v, lang) => pick(TX_DIRECTIONS, v, lang);
export const txMethodLabel    = (v, lang) => pick(TX_METHODS, v, lang);
export const txPlaceLabel     = (v, lang) => pick(TX_PLACES, v, lang);
