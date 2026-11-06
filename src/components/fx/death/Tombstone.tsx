'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/toon/Avatar';
import { toonAudio } from '../utils/sound';
import { useShake } from '../utils/ScreenShake';
import { DeathFxProps } from './GhostAscend';

export const Tombstone: React.FC<DeathFxProps> = ({
  playerName = 'Jogador',
  playerColor = '#35B8F4',
  onDone,
  isTelao = false,
}) => {
  const { shake } = useShake();
  const [slammed, setSlammed] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setSlammed(true);
      toonAudio.playExplosion();
      shake('heavy');
    }, 500);

    const tEnd = setTimeout(() => {
      onDone();
    }, 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(tEnd);
    };
  }, [onDone, shake]);

  const scale = isTelao ? 'scale-125' : 'scale-100';

  return (
    <div className={`relative flex flex-col items-center justify-center p-6 ${scale}`}>
      {/* Alvo que fica por baixo */}
      <div className="opacity-20 filter grayscale">
        <Avatar name={playerName} color={playerColor} status="dead" size={isTelao ? 'lg' : 'md'} />
      </div>

      {/* Lápide Caindo do Alto */}
      <motion.div
        initial={{ y: -180, opacity: 0 }}
        animate={slammed ? { y: -10, opacity: 1 } : { y: -120, opacity: 1 }}
        transition={{ type: 'spring', damping: 13, stiffness: 400 }}
        className="absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-center"
      >
        <svg width="110" height="120" viewBox="0 0 110 120" className="drop-shadow-[4px_4px_0px_#111111]">
          {/* Base e Pedra da Lápide */}
          <path
            d="M 15 110 L 95 110 L 95 45 Q 95 10 55 10 Q 15 10 15 45 Z"
            fill="#9CA3AF"
            stroke="#111111"
            strokeWidth="4"
          />
          {/* Cruz / R.I.P */}
          <line x1="55" y1="28" x2="55" y2="58" stroke="#111111" strokeWidth="4" strokeLinecap="round" />
          <line x1="42" y1="38" x2="68" y2="38" stroke="#111111" strokeWidth="4" strokeLinecap="round" />
          <text
            x="55"
            y="80"
            textAnchor="middle"
            fill="#111111"
            fontSize="12"
            fontWeight="900"
            fontFamily="sans-serif"
          >
            R.I.P.
          </text>
          <text
            x="55"
            y="98"
            textAnchor="middle"
            fill="#374151"
            fontSize="9"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            {playerName.slice(0, 10)}
          </text>
        </svg>

        {/* Florzinha ao lado */}
        {slammed && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-2 bottom-0 text-xl"
          >
            🌼
          </motion.div>
        )}
      </motion.div>

      {/* Banner de Morte */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 bg-[#FF3038] text-white font-black font-[family-name:var(--font-heading)] text-base px-4 py-1.5 rounded-[12px] border-2 border-[#111111] shadow-[3px_3px_0px_#111111] uppercase tracking-wider z-30"
      >
        💀 DESCANSE EM PAZ, {playerName}!
      </motion.div>
    </div>
  );
};
