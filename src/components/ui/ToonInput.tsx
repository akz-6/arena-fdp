'use client';

import React, { forwardRef } from 'react';

export interface ToonInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCount?: boolean;
}

export const ToonInput = forwardRef<HTMLInputElement, ToonInputProps>(
  (
    {
      label,
      error,
      helperText,
      showCount = false,
      maxLength,
      value,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <div className="flex justify-between items-center px-1">
            <label
              htmlFor={inputId}
              className="text-sm font-bold text-[#111111] font-[family-name:var(--font-heading)] select-none"
            >
              {label}
            </label>
            {showCount && maxLength && (
              <span className="text-xs text-[#666666] font-semibold">
                {currentLength}/{maxLength}
              </span>
            )}
          </div>
        )}

        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            value={value}
            maxLength={maxLength}
            className={`w-full px-4 py-3 bg-white text-[#111111] font-[family-name:var(--font-body)] text-base font-semibold rounded-[12px] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] placeholder:text-[#888888] outline-none transition-all duration-100 focus:border-[#35B8F4] focus:ring-4 focus:ring-[#35B8F4]/30 focus:shadow-[3px_3px_0px_#111111] disabled:opacity-50 disabled:bg-[#F5F5F5] ${
              error ? '!border-[#FF3038] !ring-[#FF3038]/30' : ''
            } ${className}`}
            {...props}
          />
        </div>

        {error ? (
          <p className="text-xs font-bold text-[#FF3038] px-1 flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-[#666666] px-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

ToonInput.displayName = 'ToonInput';
