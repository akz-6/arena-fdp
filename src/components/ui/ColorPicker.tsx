'use client';

import React from 'react';

export const PLAYER_PALETTE = [
  { hex: '#FF3038', name: 'Vermelho' },
  { hex: '#FF9500', name: 'Laranja' },
  { hex: '#FFC233', name: 'Amarelo' },
  { hex: '#2ECC71', name: 'Verde' },
  { hex: '#00C2A8', name: 'Turquesa' },
  { hex: '#35B8F4', name: 'Azul Celeste' },
  { hex: '#5B6CFF', name: 'Índigo' },
  { hex: '#8E5CF7', name: 'Roxo' },
  { hex: '#FF4FA3', name: 'Rosa' },
  { hex: '#8B5E3C', name: 'Marrom' },
  { hex: '#6B7280', name: 'Cinza' },
  { hex: '#111111', name: 'Preto' },
] as const;

export interface ColorPickerProps {
  selectedColor?: string;
  takenColors?: string[];
  onSelectColor: (color: string) => void;
  className?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  takenColors = [],
  onSelectColor,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <span className="text-sm font-bold text-[#111111] font-[family-name:var(--font-heading)] select-none">
        Escolha sua Cor
      </span>
      <div className="grid grid-cols-6 gap-2.5 sm:gap-3 p-3 bg-[#F5F5F5] rounded-[16px] border-2 border-[#111111]">
        {PLAYER_PALETTE.map((color) => {
          const isSelected = selectedColor?.toLowerCase() === color.hex.toLowerCase();
          const isTaken = takenColors.some(
            (c) => c.toLowerCase() === color.hex.toLowerCase()
          );

          return (
            <button
              key={color.hex}
              type="button"
              disabled={isTaken}
              aria-label={`Cor ${color.name}${isTaken ? ' (ocupada)' : ''}${
                isSelected ? ' (selecionada)' : ''
              }`}
              onClick={() => !isTaken && onSelectColor(color.hex)}
              className={`relative aspect-square w-full rounded-full border-2 border-[#111111] transition-all duration-100 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                isSelected
                  ? 'ring-4 ring-[#111111] ring-offset-2 scale-110 shadow-[2px_2px_0px_#111111] z-10'
                  : 'hover:scale-105 active:scale-95 shadow-[1px_1px_0px_#111111]'
              }`}
              style={{ backgroundColor: color.hex }}
            >
              {isSelected && (
                <span className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-bold text-sm">
                  ✓
                </span>
              )}
              {isTaken && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 flex items-center justify-center text-white/90 text-lg font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                >
                  ✕
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
