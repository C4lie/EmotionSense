import React from "react";
import { cn } from "../../utils/cn";

export const Button = React.forwardRef(({ 
  className, 
  variant = "primary", 
  size = "md", 
  isLoading, 
  children, 
  ...props 
}, ref) => {
  
  const variants = {
    primary: "bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-medium border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:shadow-[0_0_25px_rgba(168,85,247,0.3)]",
    secondary: "bg-zinc-950/60 backdrop-blur-md text-foreground hover:bg-zinc-900 border border-white/[0.08] hover:border-white/[0.15]",
    outline: "bg-transparent border border-white/[0.08] hover:bg-white/[0.04] hover:border-white/[0.15] text-foreground",
    ghost: "bg-transparent hover:bg-white/[0.04] text-foreground border border-transparent",
    destructive: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/25 shadow-sm",
  };

  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-5 text-base",
    lg: "h-14 px-8 text-lg font-semibold",
    icon: "h-11 w-11 flex justify-center items-center",
  };

  return (
    <button
      ref={ref}
      className={cn(
        "relative inline-flex items-center justify-center whitespace-nowrap rounded-lg transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:pointer-events-none disabled:opacity-50 overflow-hidden",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </span>
      ) : (
        <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
      )}
    </button>
  );
});

Button.displayName = "Button";
