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
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <div className={cn("rounded-full border-2 border-zinc-850 border-t-primary animate-spin", sizes[size])} />
      {text && <p className="text-xs text-muted-foreground">{text}</p>}
    </div>
  );
};
