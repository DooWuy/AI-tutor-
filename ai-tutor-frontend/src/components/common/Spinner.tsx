import React from 'react';
import { Loader2 } from 'lucide-react';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerColor = 'primary' | 'white' | 'muted' | 'current';

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
  color?: SpinnerColor;
  className?: string;
  label?: string;
}

const SIZE_MAP: Record<SpinnerSize, number> = {
  xs: 12,
  sm: 16,
  md: 22,
  lg: 32,
  xl: 48,
};

const COLOR_MAP: Record<SpinnerColor, string> = {
  primary: 'text-primary',
  white: 'text-white',
  muted: 'text-on-surface-variant/70',
  current: 'text-current',
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
  label = 'Đang tải...',
  ...props
}) => {
  const pixelSize = SIZE_MAP[size];
  const colorClass = COLOR_MAP[color];

  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-flex items-center justify-center ${className}`}
      {...props}
    >
      <Loader2
        size={pixelSize}
        className={`animate-spin ${colorClass}`}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
};
