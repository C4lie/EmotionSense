import React from "react";
import { cn } from "../../utils/cn";

/**
 * V3 Card Component System
 * 
 * Composable card with glass variants, glow effects, and animated hover states.
 * 
 * @param {string} variant - "default" | "glass" | "elevated" | "outline"
 * @param {boolean} glow - Enable accent glow on hover
 * @param {boolean} interactive - Enable hover lift/scale effect
 * @param {string} padding - "none" | "sm" | "md" | "lg"
 */
export const Card = React.forwardRef(({
  className,
  children,
  variant = "default",
  glow = false,
  interactive = false,
  padding = "md",
  ...props
}, ref) => {
  const variants = {
    default: "bg-card border border-border shadow-elevated",
    glass: "glass-card",
    elevated: "bg-surface-elevated border border-border shadow-elevated-lg",
    outline: "bg-transparent border border-border",
  };

  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl overflow-hidden transition-all duration-400 ease-out-expo",
        variants[variant],
        paddings[padding],
        glow && "glow-hover",
        interactive && "hover:-translate-y-0.5 cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
Card.displayName = "Card";

export const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef(({ className, as: Tag = "h3", ...props }, ref) => (
  <Tag ref={ref} className={cn("text-lg font-semibold leading-tight tracking-tight", className)} {...props} />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground leading-relaxed", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
));
CardFooter.displayName = "CardFooter";
