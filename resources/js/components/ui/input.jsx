import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Label sits above, helper text below, error below that. See `Field` in
 * components/form/Field.jsx for the composed pattern.
 *
 * h-11 rather than h-10: most of our traffic is thumbs on mid-range Android.
 * `aria-invalid` drives the error styling so it stays tied to the a11y state
 * instead of a parallel prop.
 */
const Input = React.forwardRef(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-11 w-full rounded border border-rule-strong bg-surface-raised px-3 py-2",
      "text-base md:text-sm text-foreground",
      "placeholder:text-fg-faint",
      "transition-colors duration-120 ease-out-quart",
      "hover:border-fg-faint",
      "focus:border-brand focus:outline-none focus-visible:outline-none",
      "aria-[invalid=true]:border-destructive",
      "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-sunken",
      "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
