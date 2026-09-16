/**
 * Formatting utility functions
 */
import { format, formatDistance, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DEFAULT_LOCALE = 'en-CA';
const DEFAULT_CURRENCY_PREFIX = 'CAD $';

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

/**
 * Format date to readable string
 */
export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: ptBR });
};

/**
 * Format date and time
 */
export const formatDateTime = (date) => {
  return formatDate(date, "dd/MM/yyyy 'at' HH:mm");
};

/**
 * Format time only
 */
export const formatTime = (date) => {
  return formatDate(date, 'HH:mm');
};

/**
 * Format relative time (e.g., "3 days ago")
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(dateObj, new Date(), { addSuffix: true, locale: ptBR });
};

/**
 * Format plain number without commas or decimals.
 */
export const formatPlainNumber = (value) => {
  const n = toNumber(value);
  if (n === null) return '';
  return Math.round(n).toString();
};

/**
 * Format number with no thousands separators (no commas).
 * Keeps decimals based on provided fraction digit options.
 */
export const formatNumberNoGrouping = (
  value,
  { minimumFractionDigits = 0, maximumFractionDigits = 0 } = {}
) => {
  const n = toNumber(value);
  if (n === null) return '';

  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    useGrouping: false,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(n);
};

/**
 * Format number with thousands separators and decimals.
 */
export const formatNumber = (
  value,
  { minimumFractionDigits = 0, maximumFractionDigits = 2, useGrouping = true } = {}
) => {
  const n = toNumber(value);
  if (n === null) return '';

  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    useGrouping,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(n);
};

/**
 * Format money consistently as Canadian dollars across Propertree.
 * A custom prefix can still be supplied for exceptional cases.
 */
export const formatCurrency = (
  amount,
  currencySymbol = DEFAULT_CURRENCY_PREFIX,
  { minimumFractionDigits = 0, maximumFractionDigits = 2 } = {}
) => {
  const formatted = formatNumber(amount, { minimumFractionDigits, maximumFractionDigits, useGrouping: true });
  if (!formatted) return '';
  return `${currencySymbol}${formatted}`;
};

/**
 * Format Canadian-dollar amounts without thousands separators.
 */
export const formatCurrencyNoGrouping = (
  amount,
  currencySymbol = DEFAULT_CURRENCY_PREFIX,
  { minimumFractionDigits = 0, maximumFractionDigits = 0 } = {}
) => {
  const formatted = formatNumber(amount, { minimumFractionDigits, maximumFractionDigits, useGrouping: false });
  if (!formatted) return '';
  return `${currencySymbol}${formatted}`;
};

/**
 * Calculate number of nights between dates
 */
export const calculateNights = (checkIn, checkOut) => {
  const checkInDate = typeof checkIn === 'string' ? parseISO(checkIn) : checkIn;
  const checkOutDate = typeof checkOut === 'string' ? parseISO(checkOut) : checkOut;
  return differenceInDays(checkOutDate, checkInDate);
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Format phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }

  return phone;
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  if (!name) return '';
  const words = name.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i)) + ' ' + sizes[i];
};

/**
 * Generate random ID
 */
export const generateId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};
