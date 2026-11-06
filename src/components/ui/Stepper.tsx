'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (newValue: number) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  value,
  min = 0,
  max = 99,
  step = 1,
  onChange,
  label,
  disabled = false,
  className = '',
}) => {
  const canDecrement = value - step >= min && !disabled;
  const canIncrement = value + step <= max && !disabled;

  const handleDecrement = () => {
    if (canDecrement) onChange(value - step);
  };

  const handleIncrement = () => {
    if (canIncrement) onChange(value + step);
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <span className="text-sm font-bold text-[#111111] font-[family-name:var(--font-heading)] select-none">
          {label}
        </span>
      )}
      <div className="flex items-center gap-2">
        {/* Botão Menos */}
        <button
          type="button"
          aria-label="Diminuir"
          disabled={!canDecrement}
          onClick={handleDecrement}
          className="w-12 h-12 flex items-center justify-center bg-white text-[#111111] font-black text-2xl rounded-[12px] border-2 border-[#111111] shadow-[3px_3px_0px_#111111] hover:bg-[#F5F5F5] hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#111111] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none select-none transition-all"
        >
          −
        </button>

        {/* Display do Número com Bounce */}
        <div className="flex-1 min-w-[70px] h-12 flex items-center justify-center bg-white rounded-[12px] border-2 border-[#111111] shadow-[3px_3px_0px_#111111] overflow-hidden px-3">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={value}
              initial={{ scale: 0.6, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.6, y: -10, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className="font-black text-2xl font-[family-name:var(--font-heading)] text-[#111111] select-none"
            >
              {value}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Botão Mais */}
        <button
          type="button"
          aria-label="Aumentar"
          disabled={!canIncrement}
          onClick={handleIncrement}
          className="w-12 h-12 flex items-center justify-center bg-[#FFC233] text-[#111111] font-black text-2xl rounded-[12px] border-2 border-[#111111] shadow-[3px_3px_0px_#111111] hover:bg-[#EBB01F] hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#111111] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none select-none transition-all"
        >
          +
        </button>
      </div>
    </div>
  );
};
