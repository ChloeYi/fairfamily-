import * as React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-[rgba(255,255,255,0.95)] bg-[rgba(255,255,255,0.8)] px-4 py-2 text-sm text-[#1e0f3c] backdrop-blur-sm transition-all duration-200",
        "placeholder:text-[#8b7fc0]",
        "focus:outline-none focus:ring-2 focus:ring-[rgba(124,58,237,0.35)] focus:border-[rgba(124,58,237,0.4)] focus:bg-[rgba(255,255,255,0.95)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
