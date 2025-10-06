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
