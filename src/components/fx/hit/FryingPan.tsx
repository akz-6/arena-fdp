'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Burst } from '@/components/toon/Burst';
import { Avatar } from '@/components/toon/Avatar';
import { toonAudio } from '../utils/sound';
import { useShake } from '../utils/ScreenShake';
import { HitFxProps } from './GunShot';

export const FryingPan: React.FC<HitFxProps> = ({
  playerName = 'Jogador',
  playerColor = '#35B8F4',
  damage,
  onDone,
  isTelao = false,
}) => {
  const { shake } = useShake();
  const [smacked, setSmacked] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setSmacked(true);
      toonAudio.playBonk();
      shake('medium');
    }, 400);

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
      {/* Frigideira Cartoon */}
      <motion.div
        initial={{ rotate: -80, x: -70, y: -40 }}
        animate={smacked ? { rotate: 10, x: -15, y: -5 } : { rotate: -60, x: -50, y: -30 }}
        transition={{ type: 'spring', stiffness: 500, damping: 16 }}
        className="absolute z-20 pointer-events-none"
      >
        <svg width="120" height="70" viewBox="0 0 120 70" className="drop-shadow-[4px_4px_0px_#111111]">
          {/* Cabo da Frigideira */}
          <rect x="10" y="28" width="50" height="12" rx="4" fill="#111111" stroke="#111111" strokeWidth="2" />
          <circle cx="16" cy="34" r="3" fill="#FFFFFF" />
          {/* Corpo Redondo */}
          <ellipse cx="80" cy="34" rx="32" ry="24" fill="#374151" stroke="#111111" strokeWidth="3.5" />
          <ellipse cx="80" cy="34" rx="24" ry="18" fill="#1F2937" />
        </svg>
      </motion.div>

      {/* Alvo */}
      <div className="relative z-10">
        <motion.div
          animate={smacked ? { scaleX: [1, 0.7, 1], scaleY: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Avatar
            name={playerName}
            color={playerColor}
            status={smacked ? 'hit' : 'idle'}
            size={isTelao ? 'lg' : 'md'}
          />
        </motion.div>

        {smacked && (
          <div className="absolute -top-10 -right-10 z-30">
            <Burst text="PANG!" color="orange" size="sm" />
          </div>
        )}
      </div>

      {damage !== null && damage !== undefined && smacked && (
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
