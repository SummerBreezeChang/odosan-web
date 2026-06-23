import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-od-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-od-bg';

const VARIANT: Record<Variant, string> = {
  primary:
    'bg-od-ink text-od-bg hover:bg-od-leaf disabled:hover:bg-od-ink',
  secondary:
    'border-[1.5px] border-od-ink/30 text-od-ink hover:border-od-ink hover:bg-od-ink/[0.03]',
  ghost:
    'text-od-ink hover:bg-od-ink/[0.04]',
};

const SIZE: Record<Size, string> = {
  md: 'px-5 py-2.5 text-[14px]',
  lg: 'px-6 py-3.5 text-[15px]',
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  className?: string;
  children: ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`${BASE} ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      {...props}
    >
      {loading ? 'Loading…' : children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  external = false,
}: CommonProps & { href: string; external?: boolean }) {
  const cls = `${BASE} ${VARIANT[variant]} ${SIZE[size]} ${className}`;
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cls}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
