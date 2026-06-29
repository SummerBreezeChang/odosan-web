import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';

const INPUT_BASE =
  'w-full rounded-xl border border-od-border bg-white px-4 py-3 text-[15px] text-od-navy placeholder:text-od-subtle transition-colors focus:border-od-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-od-primary focus-visible:ring-offset-1';

type CommonProps = {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  wrapperClassName?: string;
};

/**
 * InputField — branded single-line text input with optional label, hint,
 * and error message. All native <input> props are forwarded.
 */
export function InputField({
  label,
  hint,
  error,
  id,
  className = '',
  wrapperClassName = '',
  ...props
}: CommonProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={wrapperClassName}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-[13px] font-semibold text-od-navy"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`${INPUT_BASE} ${error ? 'border-od-red focus:border-od-red focus-visible:ring-od-red' : ''} ${className}`}
        {...props}
      />
      {hint && !error && (
        <p className="mt-1.5 text-[12px] text-od-subtle">{hint}</p>
      )}
      {error && (
        <p className="mt-1.5 text-[12px] font-medium text-od-red">{error}</p>
      )}
    </div>
  );
}

/**
 * TextareaField — same visual language as InputField but for multi-line
 * text. Resizes vertically only.
 */
export function TextareaField({
  label,
  hint,
  error,
  id,
  className = '',
  wrapperClassName = '',
  ...props
}: CommonProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={wrapperClassName}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-[13px] font-semibold text-od-navy"
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`${INPUT_BASE} resize-y ${error ? 'border-od-red focus:border-od-red focus-visible:ring-od-red' : ''} ${className}`}
        {...props}
      />
      {hint && !error && (
        <p className="mt-1.5 text-[12px] text-od-subtle">{hint}</p>
      )}
      {error && (
        <p className="mt-1.5 text-[12px] font-medium text-od-red">{error}</p>
      )}
    </div>
  );
}
