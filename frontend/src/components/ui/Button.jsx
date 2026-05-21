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
    primary: "bg-primary text-primary-foreground hover:bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] border border-blue-500/50",
    secondary: "bg-secondary text-secondary-foreground hover:bg-zinc-700 border border-white/5",
    outline: "bg-transparent border border-white/20 hover:bg-white/10 text-foreground",
    ghost: "bg-transparent hover:bg-white/10 text-foreground border border-transparent",
    destructive: "bg-destructive text-destructive-foreground hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.3)] border border-red-500/50",
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
        "relative inline-flex items-center justify-center whitespace-nowrap rounded-lg transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 overflow-hidden",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {/* Glossy overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity"></div>
      
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
