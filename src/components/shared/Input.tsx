import React from 'react';
import { AlertCircle } from 'lucide-react';
import { eandColors } from '../../constants/eandColors';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold mb-1.5" style={{ color: eandColors.oceanBlue }}>
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 border-2 rounded-xl bg-white/80 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:bg-white placeholder:text-gray-400 ${className}`}
        style={{
          borderColor: error ? eandColors.red : `${eandColors.oceanBlue}15`,
          color: eandColors.oceanBlue,
          boxShadow: error ? `0 0 0 3px ${eandColors.red}10` : 'none',
        }}
        onFocus={(e) => {
          if (!error) {
            e.target.style.borderColor = eandColors.brightGreen;
            e.target.style.boxShadow = `0 0 0 3px ${eandColors.brightGreen}15`;
          }
        }}
        onBlur={(e) => {
          if (!error) {
            e.target.style.borderColor = `${eandColors.oceanBlue}15`;
            e.target.style.boxShadow = 'none';
          }
        }}
        {...props}
      />
      {error && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: eandColors.red }} />
          <p className="text-xs font-medium" style={{ color: eandColors.red }}>{error}</p>
        </div>
      )}
    </div>
  );
}
