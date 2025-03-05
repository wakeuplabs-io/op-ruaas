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
  return `${integerPart}.${decimalPart.toString().padStart(parseInt(tokenDecimals.toString()), "0").slice(0, precision)}`;
};