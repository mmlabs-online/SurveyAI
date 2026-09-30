import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "./cn";

interface CommonProps {
  label: string;
  hint?: string;
  error?: string | null;
}

export const CONTROL =
  "w-full rounded-2xl border-2 bg-card px-4 py-3 text-base text-ink placeholder:text-muted/70 " +
  "transition-[border-color,box-shadow] duration-150 " +
  "focus-visible:border-brand focus-visible:shadow-[0_0_0_4px_var(--color-brand-soft)] focus-visible:outline-none";

function describedBy(...ids: ReadonlyArray<string | false | null | undefined>): string | undefined {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

function FieldShell({
  id,
  label,
  hint,
  error,
  children,
}: CommonProps & { id: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block pl-1 font-display text-base font-bold">
        {label}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="pl-1 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="animate-shake pl-1 text-sm font-bold text-danger"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function controlProps(id: string, hint?: string, error?: string | null) {
  return {
    id,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": describedBy(hint && `${id}-hint`, error && `${id}-error`),
  };
}

export function TextField({
  label,
  hint,
  error,
  className,
  ...rest
}: CommonProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <input
        {...controlProps(id, hint, error)}
        className={cn(CONTROL, error ? "border-danger bg-danger-soft/40" : "border-edge", className)}
        {...rest}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  className,
  ...rest
}: CommonProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <textarea
        {...controlProps(id, hint, error)}
        className={cn(
          CONTROL,
          "rounded-3xl",
          error ? "border-danger bg-danger-soft/40" : "border-edge",
          className,
        )}
        {...rest}
      />
    </FieldShell>
  );
}
