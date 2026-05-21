import React from "react";
import { cn } from "../../utils/cn";

export const Loader = ({ className, size = "md", text }) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative">
        {/* Outer glowing ring */}
        <div className={cn("absolute inset-0 rounded-full border-t-2 border-primary animate-spin opacity-70", sizes[size])} style={{ animationDuration: '1.5s' }}></div>
        {/* Inner fast ring */}
        <div className={cn("rounded-full border-2 border-transparent border-r-primary border-b-primary animate-spin", sizes[size])} style={{ animationDuration: '0.75s' }}></div>
      </div>
      {text && <p className="text-sm text-muted-foreground animate-pulse">{text}</p>}
    </div>
  );
};
