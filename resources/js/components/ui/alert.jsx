import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Logical properties throughout: the stock shadcn alert pins its icon with
 * `left-4` and pads with `pl-7`, both of which land on the wrong side in RTL.
 *
 * Deliberately no coloured side-stripe. A full hairline rule plus a tinted
 * ground carries the same severity without the accent bar.
 */
const alertVariants = cva(
  [
    "relative w-full rounded border p-4",
    "[&>svg]:absolute [&>svg]:start-4 [&>svg]:top-4 [&>svg]:size-4",
    "[&>svg~*]:ps-7",
  ],
  {
    variants: {
      variant: {
        default:     "border-rule bg-surface-raised text-foreground [&>svg]:text-fg-muted",
        accent:      "border-brand/30 bg-brand-wash text-foreground [&>svg]:text-brand",
        destructive: "border-destructive/35 bg-destructive/8 text-foreground [&>svg]:text-destructive",
        success:     "border-chart-up/30 bg-chart-up/8 text-foreground [&>svg]:text-chart-up",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5 ref={ref} className={cn("mb-1 font-semibold leading-snug", className)} {...props} />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm text-fg-muted [&_p]:leading-relaxed", className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
