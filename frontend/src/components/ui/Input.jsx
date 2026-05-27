import React, { useState } from "react";
import { cn } from "../../utils/cn";

/**
 * V3 Input Component
 * 
 * Premium form input with animated label, focus ring, error state, and variants.
 * 
 * @param {string} label - Floating label text
 * @param {string} error - Error message to display
 * @param {React.ReactNode} leftIcon - Icon inside input (left)
 * @param {React.ReactNode} rightIcon - Icon inside input (right)
 * @param {string} variant - "default" | "ghost"
 */
export const Input = React.forwardRef(({
  className,
  type = "text",
  label,
  error,
  leftIcon,
  rightIcon,
  variant = "default",
  id,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, "-") || "field"}`;

  const variants = {
    default: [
      "bg-surface/40 border-border",
      "focus:border-primary/50 focus:ring-1 focus:ring-primary/30",
      "focus:shadow-glow-sm",
    ].join(" "),
    ghost: [
      "bg-transparent border-transparent",
      "focus:bg-surface/30 focus:border-primary/30",
    ].join(" "),
  };

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            "block text-sm font-medium transition-colors duration-200",
            isFocused ? "text-primary" : "text-muted-foreground",
            error && "text-accent-danger",
          )}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          onFocus={(e) => { setIsFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setIsFocused(false); props.onBlur?.(e); }}
          className={cn(
            "flex h-11 w-full rounded-lg border px-3 py-2",
            "text-sm text-foreground",
            "placeholder:text-muted-foreground/50",
            "transition-all duration-250 ease-out-expo",
            "focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            variants[variant],
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            error && "border-accent-danger/50 focus:border-accent-danger focus:ring-accent-danger/30",
            className,
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {rightIcon}
          </span>
        )}
      </div>
      {error && (
        <p className="text-xs text-accent-danger mt-1 animate-fade-in">{error}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";

/**
 * V3 Textarea Component
 */
export const Textarea = React.forwardRef(({
  className,
  label,
  error,
  id,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaId = id || `textarea-${label?.toLowerCase().replace(/\s+/g, "-") || "field"}`;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={textareaId}
          className={cn(
            "block text-sm font-medium transition-colors duration-200",
            isFocused ? "text-primary" : "text-muted-foreground",
            error && "text-accent-danger",
          )}
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        ref={ref}
        onFocus={(e) => { setIsFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setIsFocused(false); props.onBlur?.(e); }}
        className={cn(
          "flex w-full min-h-[100px] rounded-lg border border-border",
          "bg-surface/40 px-3 py-3",
          "text-sm text-foreground resize-y",
          "placeholder:text-muted-foreground/50",
          "transition-all duration-250 ease-out-expo",
          "focus-visible:outline-none",
          "focus:border-primary/50 focus:ring-1 focus:ring-primary/30 focus:shadow-glow-sm",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-accent-danger/50",
          className,
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-accent-danger mt-1 animate-fade-in">{error}</p>
      )}
    </div>
  );
});

Textarea.displayName = "Textarea";
