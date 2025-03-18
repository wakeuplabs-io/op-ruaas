import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function readFile(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(f);
  });
}

export function safeParseJSON(value: string | null | undefined) {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const shortenAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
