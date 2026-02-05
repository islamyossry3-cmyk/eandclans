import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { eandColors } from '../../constants/eandColors';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
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
  const baseStyles = 'relative font-bold tracking-wide rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 mobile-touch';

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: `linear-gradient(135deg, ${eandColors.red} 0%, #c00700 100%)`,
      color: 'white',
      border: 'none',
      boxShadow: '0 4px 14px rgba(224, 8, 0, 0.25)',
    },
    secondary: {
      background: `linear-gradient(135deg, ${eandColors.oceanBlue} 0%, #0f0c35 100%)`,
      color: 'white',
      border: 'none',
      boxShadow: '0 4px 14px rgba(24, 17, 75, 0.25)',
    },
    danger: {
      background: `linear-gradient(135deg, #dc2626 0%, #991b1b 100%)`,
      color: 'white',
      border: 'none',
      boxShadow: '0 4px 14px rgba(220, 38, 38, 0.25)',
    },
    ghost: {
      background: 'transparent',
      color: eandColors.oceanBlue,
      border: `2px solid ${eandColors.oceanBlue}15`,
    },
    success: {
      background: `linear-gradient(135deg, ${eandColors.brightGreen} 0%, #35a050 100%)`,
      color: 'white',
      border: 'none',
      boxShadow: '0 4px 14px rgba(71, 203, 108, 0.25)',
    },
  };

  const sizes: Record<string, string> = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };

  const isDisabled = disabled || isLoading;

  return (
    <motion.button
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      whileHover={isDisabled ? undefined : { scale: 1.02, y: -1 }}
      className={`${baseStyles} ${sizes[size]} ${className}`}
      style={{ ...variantStyles[variant], ...style }}
      disabled={isDisabled}
      {...(props as any)}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="opacity-80">Loading...</span>
        </>
      ) : children}
    </motion.button>
  );
}
