import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Squared, not pill-shaped: a ledger annotation rather than a chip.
 *
 * `up` and `down` carry market direction and must never be used for anything
 * else, or the interface starts lying about which way a number moved.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:     "border-transparent bg-foreground text-background",
        accent:      "border-brand/25 bg-brand-wash text-brand",
        secondary:   "border-transparent bg-surface-sunken text-fg-muted",
        outline:     "border-rule-strong text-fg-muted",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        up:          "border-transparent bg-chart-up/12 text-chart-up font-mono tabular-nums",
        down:        "border-transparent bg-chart-down/12 text-chart-down font-mono tabular-nums",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
