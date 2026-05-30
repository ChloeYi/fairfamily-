import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 hover:scale-[1.02] active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border-2 border-[rgba(124,58,237,0.25)] bg-[rgba(255,255,255,0.72)] text-[#1e0f3c] backdrop-blur-sm hover:bg-[rgba(255,255,255,0.9)] hover:border-[rgba(124,58,237,0.5)]",
        secondary:
          "bg-[rgba(255,255,255,0.72)] text-[#1e0f3c] border border-[rgba(255,255,255,0.95)] backdrop-blur-sm shadow-sm hover:bg-[rgba(255,255,255,0.9)]",
        ghost:
          "text-[#7C3AED] hover:bg-[rgba(124,58,237,0.08)] hover:text-[#7C3AED]",
        link: "text-[#7C3AED] underline-offset-4 hover:underline",
        kids:
          "bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] text-white shadow-lg shadow-pink-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
        log:
          "bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-lg shadow-purple-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
        ai:
          "bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] text-white shadow-lg shadow-violet-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-14 rounded-2xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
