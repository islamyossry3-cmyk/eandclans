import React from 'react';
import { eandColors } from '../../constants/eandColors';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: eandColors.oceanBlue }}>
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 border-2 rounded-xl bg-white transition-all focus:outline-none focus:ring-4 ${className}`}
        style={{
          borderColor: error ? eandColors.red : eandColors.mediumGrey,
          color: eandColors.oceanBlue
        }}
        onFocus={(e) => {
          if (!error) {
            e.target.style.borderColor = eandColors.red;
            e.target.style.boxShadow = `0 0 0 4px ${eandColors.red}20`;
          }
        }}
        onBlur={(e) => {
          if (!error) {
            e.target.style.borderColor = eandColors.mediumGrey;
            e.target.style.boxShadow = 'none';
          }
        }}
        {...props}
      />
      {error && <p className="text-sm font-semibold mt-1.5" style={{ color: eandColors.red }}>{error}</p>}
    </div>
  );
}
