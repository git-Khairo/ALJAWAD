import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Editorial button.
 *
 * The brand teal is the site's one loud colour, so only `default` and
 * `accent` get to use it as a fill. Everything else is a rule, a surface
 * step, or nothing, which is what keeps the teal meaning "act here" rather
 * than merely "this is a button".
 *
 * Focus is handled by the single global :focus-visible outline in app.css
 * rather than a per-component ring, so every focusable thing on the site
 * looks identical.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded",
    "text-sm font-medium",
    "transition-[background-color,border-color,color,transform] duration-120 ease-out-quart",
    "active:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-brand-hover font-semibold",
        accent:
          "bg-primary text-primary-foreground hover:bg-brand-hover font-semibold",
        outline:
          "border border-rule-strong bg-transparent text-foreground hover:border-primary/60 hover:text-primary",
        secondary:
          "bg-surface-sunken text-foreground hover:bg-rule",
        ghost:
          "text-foreground/80 hover:bg-surface-sunken hover:text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:opacity-90",
        link:
          "text-primary underline underline-offset-4 decoration-1 hover:decoration-2 active:translate-y-0",
      },
      size: {
        xs: "h-8 px-2.5 text-xs",
        sm: "h-9 px-3.5",
        default: "h-10 px-4",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
