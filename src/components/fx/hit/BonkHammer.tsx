'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Burst } from '@/components/toon/Burst';
import { Avatar } from '@/components/toon/Avatar';
import { toonAudio } from '../utils/sound';
import { useShake } from '../utils/ScreenShake';
import { HitFxProps } from './GunShot';

export const BonkHammer: React.FC<HitFxProps> = ({
  playerName = 'Jogador',
  playerColor = '#35B8F4',
  damage,
  onDone,
  isTelao = false,
}) => {
  const { shake } = useShake();
  const [bonked, setBonked] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setBonked(true);
      toonAudio.playBonk();
      shake('heavy');
    }, 400);

    const tEnd = setTimeout(() => {
      onDone();
    }, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(tEnd);
    };
  }, [onDone, shake]);

  const scale = isTelao ? 'scale-125' : 'scale-100';

  return (
    <div className={`relative flex flex-col items-center justify-center p-6 ${scale}`}>
      {/* Marreta Cartoon */}
      <motion.div
        initial={{ rotate: -70, x: -60, y: -90, originX: 0.8, originY: 0.8 }}
        animate={bonked ? { rotate: 20, x: -10, y: -20 } : { rotate: -60, x: -50, y: -70 }}
        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        className="absolute z-20 pointer-events-none"
      >
        <svg width="120" height="90" viewBox="0 0 120 90" className="drop-shadow-[4px_4px_0px_#111111]">
          {/* Cabo de Madeira */}
          <rect x="25" y="70" width="80" height="12" rx="4" fill="#8B5E3C" stroke="#111111" strokeWidth="3" transform="rotate(-40 25 70)" />
          {/* Cabeça de Madeira da Marreta */}
          <rect x="15" y="10" width="45" height="65" rx="10" fill="#B45309" stroke="#111111" strokeWidth="4" />
          <ellipse cx="37" cy="18" rx="14" ry="6" fill="#FBBF24" opacity="0.6" />
        </svg>
      </motion.div>

      {/* Alvo com Estrelinhas Giratórias */}
      <div className="relative z-10">
        <motion.div
          animate={bonked ? { scaleY: [1, 0.6, 1], scaleX: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Avatar
            name={playerName}
            color={playerColor}
            status={bonked ? 'hit' : 'idle'}
            size={isTelao ? 'lg' : 'md'}
          />
        </motion.div>

        {bonked && (
          <>
            <div className="absolute -top-12 -right-8 z-30">
              <Burst text="BONK!" color="yellow" size="md" />
            </div>

            {/* Estrelinhas girando */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-6 left-1/2 -translate-x-1/2 w-28 h-12 pointer-events-none z-20 flex justify-between"
            >
              <span className="text-xl">⭐</span>
              <span className="text-sm">✨</span>
              <span className="text-xl">⭐</span>
            </motion.div>
          </>
        )}
      </div>

      {damage !== null && damage !== undefined && bonked && (
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
