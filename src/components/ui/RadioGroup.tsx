'use client';

/**
 * src/components/ui/RadioGroup.tsx
 * ==============================================================================
 * Accessible Styled Radio Button Group
 * Compliant with /ui-ux-pro-max guidelines for fast single-touch selection
 * ==============================================================================
 */

import React from 'react';

export interface RadioOption {
  label: string;
  value: string;
}

export interface RadioGroupProps {
  id?: string;
  label?: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  className?: string;
}

export function RadioGroup({
  label,
  options,
  value,
  onChange,
  required = false,
  error,
  className = '',
}: RadioGroupProps) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <span className="block text-sm md:text-base font-medium text-slate-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </span>
      )}

      <div className="flex flex-wrap gap-2.5">
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <label
              key={opt.value}
              className={`min-h-[44px] px-4 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 cursor-pointer transition-all select-none ${
                isSelected
                  ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-sm ring-1 ring-sky-500'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name={label}
                value={opt.value}
                checked={isSelected}
                onChange={() => onChange(opt.value)}
                className="w-4 h-4 text-sky-600 border-slate-300 focus:ring-sky-500 focus:ring-offset-0 cursor-pointer"
              />
              <span>{opt.label}</span>
            </label>
          );
        })}
      </div>

      {error && <p className="text-xs md:text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
