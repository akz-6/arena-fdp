'use client';

import React from 'react';

export interface SegmentedOption<T extends string | number> {
  label: string;
  value: T;
  icon?: React.ReactNode;
}

export interface SegmentedProps<T extends string | number> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  disabled = false,
  className = '',
}: SegmentedProps<T>) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <span className="text-sm font-bold text-[#111111] font-[family-name:var(--font-heading)] select-none">
          {label}
        </span>
      )}
      <div className="flex bg-[#F5F5F5] p-1.5 rounded-[14px] border-2 border-[#111111] gap-1.5">
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <button
              key={String(option.value)}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 font-bold font-[family-name:var(--font-heading)] text-sm rounded-[10px] transition-all duration-100 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                isSelected
                  ? 'bg-[#111111] text-white border-2 border-[#111111] shadow-[2px_2px_0px_#111111] scale-[1.02]'
                  : 'bg-transparent text-[#666666] hover:text-[#111111] hover:bg-white/60'
              }`}
            >
              {option.icon && <span>{option.icon}</span>}
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
