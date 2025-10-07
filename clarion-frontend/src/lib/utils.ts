import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * A simple utility to estimate the number of tokens in a string.
 * This is a basic implementation and might not match the tokenizer of a specific LLM.
 */
export function countTokens(text: string): number {
  if (!text) return 0;
  // Matches sequences of non-whitespace characters.
  const tokens = text.match(/\S+/g) || [];
  return tokens.length;
}

export const formatTokenCount = (count: number): string => {
    if (count < 1000) {
        return count.toString();
    }
    if (count < 1_000_000) {
        return `${(count / 1000).toFixed(1)}K`;
    }
    return `${(count / 1_000_000).toFixed(1)}M`;
};
