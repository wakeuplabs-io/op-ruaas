import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function readFile(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(f);
  })
}

export const formatTokenAmount = (value: bigint, tokenDecimals: bigint = 18n, precision: number = 2): string => {
  const factor = 10n ** tokenDecimals;
  const integerPart = value / factor;
  const decimalPart = value % factor;
  if(precision === 0) return integerPart.toString();
  return `${integerPart}.${decimalPart.toString().padStart(parseInt(tokenDecimals.toString()), "0").slice(0, precision)}`;
};



export function formatRemainingTime(balance: bigint, pricePerMonth: bigint): string {
  if (balance <= 0n) return "0 seconds remaining";

  const SECONDS_PER_MINUTE = 60n;
  const MINUTES_PER_HOUR = 60n;
  const HOURS_PER_DAY = 24n;
  const DAYS_PER_MONTH = 30n;
  const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;
  const SECONDS_PER_DAY = SECONDS_PER_HOUR * HOURS_PER_DAY;
  const SECONDS_PER_MONTH = SECONDS_PER_DAY * DAYS_PER_MONTH;

  const pricePerSecond = pricePerMonth / SECONDS_PER_MONTH;
  const remainingSeconds = balance / pricePerSecond;

  if (remainingSeconds >= SECONDS_PER_MONTH) {
    const months = remainingSeconds / SECONDS_PER_MONTH;
    return `${months.toString()} months remaining`;
  }

  if (remainingSeconds >= SECONDS_PER_DAY) {
    const days = remainingSeconds / SECONDS_PER_DAY;
    return `${days.toString()} days remaining`;
  }

  if (remainingSeconds >= SECONDS_PER_HOUR) {
    const hours = remainingSeconds / SECONDS_PER_HOUR;
    return `${hours.toString()} hours remaining`;
  }

  if (remainingSeconds >= SECONDS_PER_MINUTE) {
    const minutes = remainingSeconds / SECONDS_PER_MINUTE;
    return `${minutes.toString()} minutes remaining`;
  }

  return `${remainingSeconds.toString()} seconds remaining`;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function safeParseJSON (value: string | null | undefined) {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
};