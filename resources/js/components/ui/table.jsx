import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Ledger table. Hairline rules, sunken header, no zebra striping.
 *
 * Alignment uses text-start / text-end throughout: this site is Arabic-first
 * and the stock shadcn `text-left` silently breaks every header in RTL.
 *
 * For numeric columns pass `numeric` to TableCell/TableHead, which switches
 * to tabular mono and end-alignment so decimal points line up down the column.
 */
const Table = React.forwardRef(({ className, containerClassName, ...props }, ref) => (
  <div className={cn("relative w-full overflow-x-auto", containerClassName)}>
    <table ref={ref} className={cn("w-full caption-bottom border-collapse text-sm", className)} {...props} />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("bg-surface-sunken [&_tr]:border-b [&_tr]:border-rule", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn("border-t border-rule-strong bg-surface-sunken font-medium [&>tr]:last:border-b-0", className)}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-rule transition-colors duration-120",
      "hover:bg-surface-sunken/60 data-[state=selected]:bg-brand-wash",
      className,
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef(({ className, numeric, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-3 align-middle font-medium text-fg-muted",
      "text-[0.6875rem] uppercase tracking-[0.08em]",
      numeric ? "text-end" : "text-start",
      "[&:has([role=checkbox])]:pe-0",
      className,
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef(({ className, numeric, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "px-3 py-3 align-middle",
      numeric ? "text-end font-mono tabular-nums" : "text-start",
      "[&:has([role=checkbox])]:pe-0",
      className,
    )}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn("mt-3 text-start text-sm text-fg-faint", className)} {...props} />
));
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
