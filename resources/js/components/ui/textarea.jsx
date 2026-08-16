import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[7rem] w-full rounded border border-rule-strong bg-surface-raised px-3 py-2.5",
      "text-base md:text-sm text-foreground leading-relaxed",
      "placeholder:text-fg-faint",
      "transition-colors duration-120 ease-out-quart",
      "hover:border-fg-faint",
      "focus:border-brand focus:outline-none focus-visible:outline-none",
      "aria-[invalid=true]:border-destructive",
      "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-sunken",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
