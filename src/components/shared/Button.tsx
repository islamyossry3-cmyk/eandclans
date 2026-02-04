import React from 'react';
import { eandColors } from '../../constants/eandColors';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  disabled,
  className = '',
  style,
  ...props
}: ButtonProps) {
  const baseStyles = 'font-bold uppercase tracking-wider rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0';

  const variantStyles = {
    primary: {
      background: `linear-gradient(135deg, ${eandColors.red} 0%, #c00700 100%)`,
      color: 'white',
      border: 'none'
    },
    secondary: {
      background: `linear-gradient(135deg, ${eandColors.oceanBlue} 0%, #0f0c35 100%)`,
      color: 'white',
      border: 'none'
    },
    danger: {
      background: `linear-gradient(135deg, ${eandColors.red} 0%, #c00700 100%)`,
      color: 'white',
      border: 'none'
    },
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${sizes[size]} ${className}`}
      style={{ ...variantStyles[variant], ...style }}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <span className="inline-block animate-spin">⌛</span> : children}
    </button>
  );
}
