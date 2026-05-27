import React from "react";
import { cn } from "../../utils/cn";

/**
 * V3 Button Component
 * 
 * Premium button with multiple variants, sizes, loading state, and icon support.
 * Uses design tokens for consistent theming.
 * 
 * @param {string} variant - "primary" | "secondary" | "outline" | "ghost" | "destructive" | "premium"
 * @param {string} size - "xs" | "sm" | "md" | "lg" | "icon"
 * @param {boolean} isLoading - Shows spinner and disables interaction
 * @param {React.ReactNode} leftIcon - Icon before text
 * @param {React.ReactNode} rightIcon - Icon after text
 * @param {boolean} fullWidth - Stretches to container width
 */
export const Button = React.forwardRef(({
  className,
  variant = "primary",
  size = "md",
  isLoading,
  leftIcon,
  rightIcon,
  fullWidth,
  children,
  ...props
}, ref) => {

  const variants = {
    primary: [
      "bg-gradient-to-r from-primary to-accent text-white font-medium",
      "border border-primary/20",
      "shadow-glow-sm hover:shadow-glow-md",
      "hover:brightness-110",
    ].join(" "),
    secondary: [
      "bg-surface backdrop-blur-md text-foreground",
      "border border-border hover:border-border/80",
      "hover:bg-surface-elevated",
    ].join(" "),
    outline: [
      "bg-transparent text-foreground",
      "border border-border hover:border-primary/30",
      "hover:bg-primary/5",
    ].join(" "),
    ghost: [
      "bg-transparent text-foreground",
      "border border-transparent",
      "hover:bg-primary/5",
    ].join(" "),
    destructive: [
      "bg-accent-danger/10 text-accent-danger",
      "border border-accent-danger/20",
      "hover:bg-accent-danger/15 hover:border-accent-danger/30",
    ].join(" "),
    premium: [
      "bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold",
      "border border-amber-400/30",
      "shadow-[0_0_20px_rgba(245,158,11,0.2)]",
      "hover:shadow-[0_0_30px_rgba(245,158,11,0.35)] hover:brightness-110",
    ].join(" "),
  };

  const sizes = {
    xs: "h-7 px-2.5 text-xs gap-1 rounded-md",
    sm: "h-9 px-3.5 text-sm gap-1.5 rounded-lg",
    md: "h-11 px-5 text-sm gap-2 rounded-lg",
    lg: "h-13 px-7 text-base gap-2.5 rounded-xl font-semibold",
    icon: "h-10 w-10 rounded-lg flex justify-center items-center",
  };

  return (
    <button
      ref={ref}
      className={cn(
        "relative inline-flex items-center justify-center whitespace-nowrap",
        "transition-all duration-250 ease-out-expo",
        "focus-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        "active:scale-[0.98]",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading...</span>
        </span>
      ) : (
        <span className="relative z-10 flex items-center justify-center gap-inherit">
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </span>
      )}
    </button>
  );
});

Button.displayName = "Button";
