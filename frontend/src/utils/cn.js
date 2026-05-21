import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names conditionally and merges tailwind classes safely.
 * Solves the problem of conflicting tailwind utility classes.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
