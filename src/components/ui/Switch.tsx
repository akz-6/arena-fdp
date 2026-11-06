'use client';

import React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
}) => {
  const switchId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex items-center justify-between gap-4 py-1">
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label
              htmlFor={switchId}
              className="text-sm font-bold text-[#111111] font-[family-name:var(--font-heading)] select-none cursor-pointer"
            >
              {label}
            </label>
          )}
          {description && (
            <span className="text-xs text-[#666666]">{description}</span>
          )}
        </div>
      )}

      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-[#111111] shadow-[2px_2px_0px_#111111] transition-colors duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-[#35B8F4]/40 disabled:opacity-40 disabled:cursor-not-allowed ${
          checked ? 'bg-[#2ECC71]' : 'bg-[#E5E5E5]'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white border-2 border-[#111111] shadow-[1px_1px_0px_#111111] transition duration-200 ease-in-out mt-[1px] ml-[1px] ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};
