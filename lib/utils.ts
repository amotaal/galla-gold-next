// /lib/utils.ts
// Utility Functions for GALLA.GOLD Application
// Purpose: Common helper functions used throughout the application

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// =============================================================================
// CSS UTILITIES
// =============================================================================

/**
 * Merge Tailwind CSS classes with proper precedence
 * Combines clsx and tailwind-merge for optimal class merging
 * 
 * @param inputs - Class names or conditional class objects
 * @returns Merged class string
 * 
 * @example
 * cn('px-2 py-1', 'px-3') // => 'py-1 px-3'
 * cn('text-red-500', condition && 'text-blue-500') // => conditional class
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// =============================================================================
// NUMBER FORMATTING
// =============================================================================

/**
 * Format number as currency with proper locale and currency symbol
 * 
 * @param amount - Amount to format
 * @param currency - Currency code (USD, EUR, etc.)
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(1234.56, 'USD') // => "$1,234.56"
 * formatCurrency(1234.56, 'EUR', 'de-DE') // => "1.234,56 €"
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format number with thousand separators
 * 
 * @param num - Number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string
 * 
 * @example
 * formatNumber(1234567.89) // => "1,234,567.89"
 * formatNumber(1234567.89, 0) // => "1,234,568"
 */
export function formatNumber(num: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format number as percentage
 * 
 * @param value - Value to format (0.15 = 15%)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 * 
 * @example
 * formatPercentage(0.1523) // => "15.23%"
 * formatPercentage(0.1523, 1) // => "15.2%"
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format number with suffix (K, M, B)
 * 
 * @param num - Number to format
 * @returns Formatted number string with suffix
 * 
 * @example
 * formatNumberWithSuffix(1234) // => "1.2K"
 * formatNumberWithSuffix(1234567) // => "1.2M"
 * formatNumberWithSuffix(1234567890) // => "1.2B"
 */
export function formatNumberWithSuffix(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
}

// =============================================================================
// DATE/TIME UTILITIES
// =============================================================================

/**
 * Format date to relative time (e.g., "2 hours ago")
 * 
 * @param date - Date to format
 * @param locale - Locale for formatting (default: 'en')
 * @returns Relative time string
 * 
 * @example
 * formatRelativeTime(new Date(Date.now() - 3600000)) // => "1 hour ago"
 * formatRelativeTime(new Date(Date.now() - 86400000)) // => "1 day ago"
 */
export function formatRelativeTime(date: Date | string, locale: string = 'en'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  } else if (diffInSeconds < 604800) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  } else if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 604800), 'week');
  } else if (diffInSeconds < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
  }
}

/**
 * Format date to human-readable string
 * 
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 * 
 * @example
 * formatDate(new Date()) // => "January 1, 2024"
 * formatDate(new Date(), { dateStyle: 'short' }) // => "1/1/24"
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Format date with time
 * 
 * @param date - Date to format
 * @returns Formatted date and time string
 * 
 * @example
 * formatDateTime(new Date()) // => "January 1, 2024 at 12:00 PM"
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(dateObj);
}

// =============================================================================
// STRING UTILITIES
// =============================================================================

/**
 * Truncate string with ellipsis
 * 
 * @param str - String to truncate
 * @param length - Maximum length
 * @returns Truncated string
 * 
 * @example
 * truncate("Hello World", 5) // => "Hello..."
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Capitalize first letter of each word
 * 
 * @param str - String to capitalize
 * @returns Capitalized string
 * 
 * @example
 * capitalize("hello world") // => "Hello World"
 */
export function capitalize(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Convert string to slug (URL-friendly)
 * 
 * @param str - String to convert
 * @returns Slug string
 * 
 * @example
 * slugify("Hello World!") // => "hello-world"
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate random string
 * 
 * @param length - Length of string
 * @returns Random string
 * 
 * @example
 * randomString(10) // => "aBcDeFgHiJ"
 */
export function randomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validate email address
 * 
 * @param email - Email to validate
 * @returns True if valid email
 * 
 * @example
 * isValidEmail("user@example.com") // => true
 * isValidEmail("invalid-email") // => false
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (basic validation)
 * 
 * @param phone - Phone number to validate
 * @returns True if valid phone number
 * 
 * @example
 * isValidPhone("+1234567890") // => true
 * isValidPhone("123") // => false
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate strong password
 * Must contain: uppercase, lowercase, number, special char, min 8 chars
 * 
 * @param password - Password to validate
 * @returns True if strong password
 * 
 * @example
 * isStrongPassword("Test123!") // => true
 * isStrongPassword("weak") // => false
 */
export function isStrongPassword(password: string): boolean {
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
}

// =============================================================================
// ARRAY UTILITIES
// =============================================================================

/**
 * Remove duplicates from array
 * 
 * @param arr - Array with possible duplicates
 * @returns Array without duplicates
 * 
 * @example
 * unique([1, 2, 2, 3, 3, 3]) // => [1, 2, 3]
 */
export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/**
 * Group array by key
 * 
 * @param arr - Array to group
 * @param key - Key to group by
 * @returns Grouped object
 * 
 * @example
 * groupBy([{type: 'a'}, {type: 'b'}, {type: 'a'}], 'type')
 * // => { a: [{type: 'a'}, {type: 'a'}], b: [{type: 'b'}] }
 */
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Sort array by key
 * 
 * @param arr - Array to sort
 * @param key - Key to sort by
 * @param order - Sort order ('asc' or 'desc')
 * @returns Sorted array
 * 
 * @example
 * sortBy([{age: 30}, {age: 20}], 'age') // => [{age: 20}, {age: 30}]
 */
export function sortBy<T>(arr: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...arr].sort((a, b) => {
    if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

// =============================================================================
// OBJECT UTILITIES
// =============================================================================

/**
 * Deep clone an object
 * 
 * @param obj - Object to clone
 * @returns Cloned object
 * 
 * @example
 * const cloned = deepClone({a: 1, b: {c: 2}})
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Pick specific keys from object
 * 
 * @param obj - Source object
 * @param keys - Keys to pick
 * @returns New object with picked keys
 * 
 * @example
 * pick({a: 1, b: 2, c: 3}, ['a', 'c']) // => {a: 1, c: 3}
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * Omit specific keys from object
 * 
 * @param obj - Source object
 * @param keys - Keys to omit
 * @returns New object without omitted keys
 * 
 * @example
 * omit({a: 1, b: 2, c: 3}, ['b']) // => {a: 1, c: 3}
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result;
}

// =============================================================================
// ASYNC UTILITIES
// =============================================================================

/**
 * Sleep for specified milliseconds
 * 
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after sleep
 * 
 * @example
 * await sleep(1000) // Wait 1 second
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry async function with exponential backoff
 * 
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries
 * @param delay - Initial delay in milliseconds
 * @returns Result of function
 * 
 * @example
 * await retry(() => fetchData(), 3, 1000)
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await sleep(delay * Math.pow(2, i));
      }
    }
  }
  
  throw lastError!;
}

// =============================================================================
// LOCAL STORAGE UTILITIES
// =============================================================================

/**
 * Safely get item from localStorage
 * 
 * @param key - Storage key
 * @param defaultValue - Default value if key doesn't exist
 * @returns Parsed value or default
 * 
 * @example
 * const user = getLocalStorage('user', null)
 */
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Safely set item in localStorage
 * 
 * @param key - Storage key
 * @param value - Value to store
 * 
 * @example
 * setLocalStorage('user', { id: 1, name: 'John' })
 */
export function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
}

/**
 * Remove item from localStorage
 * 
 * @param key - Storage key
 * 
 * @example
 * removeLocalStorage('user')
 */
export function removeLocalStorage(key: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
}

// =============================================================================
// CLIPBOARD UTILITIES
// =============================================================================

/**
 * Copy text to clipboard
 * 
 * @param text - Text to copy
 * @returns Promise that resolves when copied
 * 
 * @example
 * await copyToClipboard('Hello World')
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (typeof window === 'undefined' || !navigator.clipboard) {
    throw new Error('Clipboard API not available');
  }
  
  await navigator.clipboard.writeText(text);
}

// =============================================================================
// URL UTILITIES
// =============================================================================

/**
 * Parse query string to object
 * 
 * @param queryString - Query string to parse
 * @returns Parsed object
 * 
 * @example
 * parseQueryString('?foo=bar&baz=qux') // => {foo: 'bar', baz: 'qux'}
 */
export function parseQueryString(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
}

/**
 * Build query string from object
 * 
 * @param params - Parameters object
 * @returns Query string
 * 
 * @example
 * buildQueryString({foo: 'bar', baz: 'qux'}) // => 'foo=bar&baz=qux'
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.append(key, String(value));
    }
  });
  
  return searchParams.toString();
}

// =============================================================================
// FILE UTILITIES
// =============================================================================

/**
 * Format file size to human-readable string
 * 
 * @param bytes - File size in bytes
 * @returns Formatted file size
 * 
 * @example
 * formatFileSize(1024) // => "1 KB"
 * formatFileSize(1048576) // => "1 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Download file from URL
 * 
 * @param url - File URL
 * @param filename - Filename for download
 * 
 * @example
 * downloadFile('/api/export/transactions.csv', 'transactions.csv')
 */
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// =============================================================================
// COLOR UTILITIES
// =============================================================================

/**
 * Get color based on value (positive/negative)
 * 
 * @param value - Numeric value
 * @returns Color class name
 * 
 * @example
 * getColorByValue(10) // => 'text-success'
 * getColorByValue(-10) // => 'text-destructive'
 */
export function getColorByValue(value: number): string {
  if (value > 0) return 'text-success';
  if (value < 0) return 'text-destructive';
  return 'text-muted-foreground';
}

/**
 * Get transaction status color
 * 
 * @param status - Transaction status
 * @returns Color class name
 * 
 * @example
 * getStatusColor('completed') // => 'text-success'
 * getStatusColor('failed') // => 'text-destructive'
 */
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    completed: 'text-success',
    pending: 'text-amber-500',
    processing: 'text-blue-500',
    failed: 'text-destructive',
    cancelled: 'text-muted-foreground',
    refunded: 'text-purple-500',
  };
  
  return statusColors[status] || 'text-muted-foreground';
}
