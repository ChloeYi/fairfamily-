import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[rgba(124,58,237,0.12)] text-[#7C3AED]",
        secondary:
          "border-transparent bg-[rgba(255,255,255,0.72)] text-[#1e0f3c]",
        destructive:
          "border-transparent bg-[rgba(236,72,153,0.12)] text-[#EC4899]",
        outline: "border-[rgba(124,58,237,0.25)] text-[#7C3AED]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
