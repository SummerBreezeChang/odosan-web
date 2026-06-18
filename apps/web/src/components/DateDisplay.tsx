'use client';

import { useState, useEffect } from 'react';

type DateDisplayProps = {
  dateString: string;
  format?: 'short' | 'long';
  className?: string;
};

export function DateDisplay({ dateString, format = 'long', className = '' }: DateDisplayProps) {
  const [formatted, setFormatted] = useState('');

  useEffect(() => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions =
      format === 'short'
        ? { month: 'short', day: 'numeric' }
        : { month: 'short', day: 'numeric', year: 'numeric' };
    setFormatted(date.toLocaleDateString('en-US', options));
  }, [dateString, format]);

  return (
    <span className={className} suppressHydrationWarning>
      {formatted}
    </span>
  );
}
