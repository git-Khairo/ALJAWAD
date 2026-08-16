import { useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * The form pattern for the whole site: label above the control, helper text
 * under it, error under that. Never a placeholder standing in for a label.
 *
 * Wiring `aria-describedby` and `aria-invalid` here means every form gets
 * screen-reader-correct errors without each page remembering to do it.
 *
 * Usage:
 *   <Field label="Email" error={errors.email} hint="We reply within a day">
 *     {(props) => <Input type="email" {...props} />}
 *   </Field>
 */
export function Field({ label, hint, error, required, className, children, htmlFor }) {
  const auto = useId();
  const id = htmlFor ?? auto;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const controlProps = {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    'aria-required': required || undefined,
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required && (
          <span className="ms-1 text-brand" aria-hidden="true">*</span>
        )}
      </label>

      {typeof children === 'function' ? children(controlProps) : children}

      {hint && !error && (
        <p id={hintId} className="text-xs text-fg-faint">{hint}</p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

export default Field;
