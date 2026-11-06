'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/toon/Avatar';
import { toonAudio } from '../utils/sound';

export interface DeathFxProps {
  playerName?: string;
  playerColor?: string;
  seed?: number;
  onDone: () => void;
  isTelao?: boolean;
}

export const GhostAscend: React.FC<DeathFxProps> = ({
  playerName = 'Jogador',
  playerColor = '#35B8F4',
  onDone,
  isTelao = false,
}) => {
  useEffect(() => {
    toonAudio.playSlideDown();
    const timer = setTimeout(() => {
      onDone();
    }, 3200);

    return () => clearTimeout(timer);
  }, [onDone]);

  const scale = isTelao ? 'scale-125' : 'scale-100';

  return (
    <div className={`relative flex flex-col items-center justify-center p-6 ${scale}`}>
      {/* Corpo Caído no Chão */}
      <div className="opacity-40 filter grayscale">
        <Avatar name={playerName} color={playerColor} status="dead" size={isTelao ? 'lg' : 'md'} />
      </div>

      {/* Fantasminha Subindo ao Céu */}
      <motion.div
        initial={{ y: 0, opacity: 0.8, scale: 0.9 }}
        animate={{ y: -140, opacity: 0, scale: 1.1 }}
        transition={{ duration: 2.8, ease: 'easeOut' }}
        className="absolute z-20 pointer-events-none flex flex-col items-center"
      >
        {/* Auréola Dourada */}
        <div className="w-12 h-4 rounded-full border-2 border-[#FFC233] bg-[#FFC233]/40 shadow-[0_0_10px_#FFC233] mb-1" />

        <svg width="80" height="90" viewBox="0 0 80 90" className="drop-shadow-[3px_3px_0px_rgba(0,0,0,0.2)]">
          {/* Corpo Fantasmagórico */}
          <path
            d="M 40 10 Q 70 10 70 45 L 70 75 Q 60 65 50 75 Q 40 65 30 75 Q 20 65 10 75 L 10 45 Q 10 10 40 10 Z"
            fill="#FFFFFF"
            stroke="#111111"
            strokeWidth="3.5"
          />
          {/* Olhinhos fofos */}
          <circle cx="28" cy="38" r="4" fill="#111111" />
          <circle cx="52" cy="38" r="4" fill="#111111" />
          <path d="M 36 50 Q 40 56 44 50" fill="none" stroke="#111111" strokeWidth="2.5" />
          {/* Harpa Pequena */}
          <path d="M 52 48 Q 62 48 60 62 L 52 62 Z" fill="#FFC233" stroke="#111111" strokeWidth="2" />
        </svg>

        <span className="text-xs font-bold font-[family-name:var(--font-heading)] text-white bg-black/60 px-2 py-0.5 rounded-full mt-1">
          Adeus mundo...
        </span>
      </motion.div>

      {/* Banner de Morte */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 bg-[#FF3038] text-white font-black font-[family-name:var(--font-heading)] text-base px-4 py-1.5 rounded-[12px] border-2 border-[#111111] shadow-[3px_3px_0px_#111111] uppercase tracking-wider"
      >
        💀 {playerName} MORREU!
      </motion.div>
    </div>
  );
};
