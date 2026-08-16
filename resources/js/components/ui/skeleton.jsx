import { cn } from "@/lib/utils";

/**
 * Skeletons must match the size of the thing they stand in for, so the layout
 * does not jump when real content lands. Prefer a few shaped blocks over a
 * generic spinner.
 */
function Skeleton({ className, ...props }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-sm bg-surface-sunken", className)}
      {...props}
    />
  );
}

/** A block of text lines, last one short, the way real paragraphs end. */
function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3.5"
          style={{ width: i === lines - 1 ? '62%' : '100%' }}
        />
      ))}
    </div>
  );
}

export { Skeleton, SkeletonText };
