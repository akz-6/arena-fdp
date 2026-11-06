'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Burst } from '@/components/toon/Burst';
import { Avatar } from '@/components/toon/Avatar';
import { toonAudio } from '../utils/sound';
import { useShake } from '../utils/ScreenShake';
import { HitFxProps } from './GunShot';

export const RubberKnife: React.FC<HitFxProps> = ({
  playerName = 'Jogador',
  playerColor = '#35B8F4',
  damage,
  onDone,
  isTelao = false,
}) => {
  const { shake } = useShake();
  const [bended, setBended] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setBended(true);
      toonAudio.playBonk();
      shake('light');
    }, 450);

    const tEnd = setTimeout(() => {
      onDone();
    }, 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(tEnd);
    };
  }, [onDone, shake]);

  const scale = isTelao ? 'scale-125' : 'scale-100';

  return (
    <div className={`relative flex flex-col items-center justify-center p-6 ${scale}`}>
      {/* Faca de Borracha */}
      <motion.div
        initial={{ x: 140, y: -20, rotate: 45 }}
        animate={bended ? { x: 30, y: 0, rotate: 15 } : { x: 50, y: 0, rotate: 30 }}
        transition={{ type: 'spring', damping: 14 }}
        className="absolute right-1/2 translate-x-full top-1/2 -translate-y-1/2 z-20 pointer-events-none"
      >
        <svg width="100" height="70" viewBox="0 0 100 70" className="drop-shadow-[3px_3px_0px_#111111]">
          {/* Cabo */}
          <rect x="65" y="24" width="30" height="14" rx="3" fill="#111111" stroke="#111111" strokeWidth="2" />
          <line x1="75" y1="24" x2="75" y2="38" stroke="#FFFFFF" strokeWidth="2" />
          <line x1="85" y1="24" x2="85" y2="38" stroke="#FFFFFF" strokeWidth="2" />

          {/* Lâmina de Borracha (curva quando bate) */}
          {bended ? (
            <path
              d="M 65 24 L 35 24 Q 20 45 35 55 L 45 55 Q 35 40 65 38 Z"
              fill="#35B8F4"
              stroke="#111111"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d="M 65 24 L 15 28 Q 5 31 15 34 L 65 38 Z"
              fill="#35B8F4"
              stroke="#111111"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </motion.div>

      {/* Alvo */}
      <div className="relative z-10">
        <Avatar
          name={playerName}
          color={playerColor}
          status={bended ? 'hit' : 'idle'}
          size={isTelao ? 'lg' : 'md'}
        />

        {bended && (
          <div className="absolute -top-10 -left-10 z-30">
            <Burst text="PLIN!" color="blue" size="sm" />
          </div>
        )}
      </div>

      {damage !== null && damage !== undefined && bended && (
        <motion.div
          initial={{ y: 0, opacity: 0, scale: 0.5 }}
          animate={{ y: -30, opacity: 1, scale: 1.2 }}
          className="absolute -top-4 font-black font-[family-name:var(--font-heading)] text-3xl text-[#FF3038] drop-shadow-[2px_2px_0px_#111111] z-40"
        >
          -{damage}
        </motion.div>
      )}
    </div>
  );
};
