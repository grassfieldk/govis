import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 金額を日本語の通貨単位で表示する（兆・億・万円）
 * @param amount - 金額（円）
 * @returns フォーマットされた文字列
 */
export function formatCurrency(amount: number): string {
  if (amount >= 1000000000000) {
    // 1兆以上
    return `${(amount / 1000000000000).toFixed(1)}兆円`;
  }
  if (amount >= 100000000) {
    // 1億以上1兆未満
    return `${(amount / 100000000).toFixed(1)}億円`;
  }
  if (amount >= 10000) {
    // 1万以上1億未満
    return `${(amount / 10000).toFixed(1)}万円`;
  }
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(amount);
}
