import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge classnames with Tailwind CSS conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as USD currency
 */
export function formatCurrency(
  value: number | null | undefined,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    compact?: boolean;
  }
): string {
  if (value === null || value === undefined) {
    return "$0.00";
  }

  const { minimumFractionDigits = 2, maximumFractionDigits = 2, compact = false } = options || {};

  if (compact) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      compactDisplay: "short",
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(value);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

/**
 * Format a number as compact USD (e.g., $156K, $1.6M, $2.3B)
 * Smart abbreviation: K for thousands, M for millions, B for billions
 */
export function formatCompactCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) return "$0";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

/**
 * Format a number as a percentage
 */
export function formatPercent(
  value: number | null | undefined,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  if (value === null || value === undefined) {
    return "0%";
  }

  const { minimumFractionDigits = 1, maximumFractionDigits = 1 } = options || {};

  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value / 100);
}

/**
 * Format a date
 */
export function formatDate(
  date: Date | string | null | undefined,
  options?: {
    format?: "short" | "long" | "numeric";
    includeTime?: boolean;
  }
): string {
  if (!date) {
    return "";
  }

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return "";
  }

  const { format = "short", includeTime = false } = options || {};

  const dateFormatOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: format === "long" ? "long" : "2-digit",
    day: "2-digit",
  };

  if (includeTime) {
    dateFormatOptions.hour = "2-digit";
    dateFormatOptions.minute = "2-digit";
  }

  return new Intl.DateTimeFormat("en-US", dateFormatOptions).format(dateObj);
}

/**
 * Get initials from a name
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) {
    return "?";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .filter(Boolean)
    .join("");
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Get the change type for styling
 */
export function getChangeType(
  change: number,
  isPositiveGood: boolean = true
): "positive" | "negative" | "neutral" {
  if (change === 0) return "neutral";
  if (isPositiveGood) {
    return change > 0 ? "positive" : "negative";
  }
  return change > 0 ? "negative" : "positive";
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
