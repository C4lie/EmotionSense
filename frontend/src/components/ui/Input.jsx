import React from "react";
import { cn } from "../../utils/cn";

export const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-md border border-white/[0.08] bg-zinc-950/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 focus:shadow-[0_0_15px_rgba(168,85,247,0.15)] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";
