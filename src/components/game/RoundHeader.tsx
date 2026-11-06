'use client';

import React from 'react';

export interface RoundHeaderProps {
  roundNumber: number;
  cardsThisRound: number;
  dealerName?: string;
  isTelao?: boolean;
}

export const RoundHeader: React.FC<RoundHeaderProps> = ({
  roundNumber,
  cardsThisRound,
  dealerName = 'Alguém',
  isTelao = false,
}) => {
  return (
    <div
      className={`w-full bg-[#FFC233] rounded-[18px] border-3 border-[#111111] shadow-[4px_4px_0px_#111111] text-[#111111] font-[family-name:var(--font-heading)] flex flex-col items-center justify-center text-center p-3 sm:p-4 select-none ${
        isTelao ? 'p-6 scale-105' : ''
      }`}
    >
      <div className="flex items-center gap-2 text-xl sm:text-2xl font-black">
        <span>Rodada {roundNumber}</span>
        <span>•</span>
        <span className="text-[#FF3038]">{cardsThisRound} {cardsThisRound === 1 ? 'carta' : 'cartas'}</span>
      </div>

      <div className="text-xs sm:text-sm font-bold text-[#111111]/80 mt-0.5 flex items-center gap-1.5">
        <span>🃏 Distribui:</span>
        <span className="bg-white px-2 py-0.5 rounded-[6px] border border-[#111111] text-[#111111]">
          {dealerName}
        </span>
      </div>
    </div>
  );
};
