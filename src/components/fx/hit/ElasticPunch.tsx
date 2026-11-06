'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Burst } from '@/components/toon/Burst';
import { Avatar } from '@/components/toon/Avatar';
import { toonAudio } from '../utils/sound';
import { useShake } from '../utils/ScreenShake';
import { HitFxProps } from './GunShot';

export const ElasticPunch: React.FC<HitFxProps> = ({
  playerName = 'Jogador',
  playerColor = '#35B8F4',
  damage,
  onDone,
  isTelao = false,
}) => {
  const { shake } = useShake();
  const [punched, setPunched] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setPunched(true);
      toonAudio.playBonk();
      shake('heavy');
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
      {/* Braço Elástico com Luva Gigante */}
      <motion.div
        initial={{ x: -220, scaleX: 0.2 }}
        animate={punched ? { x: -35, scaleX: 1 } : { x: -160, scaleX: 0.5 }}
        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
        className="absolute left-1/2 -translate-x-full top-1/2 -translate-y-1/2 z-20 pointer-events-none"
      >
        <svg width="180" height="90" viewBox="0 0 180 90" className="drop-shadow-[4px_4px_0px_#111111]">
          {/* Braço Ondulado de Borracha */}
          <path
            d="M 0 45 Q 30 25 60 45 Q 90 65 120 45 L 120 55 Q 90 75 60 55 Q 30 35 0 55 Z"
            fill="#FFC233"
            stroke="#111111"
            strokeWidth="3.5"
          />
          {/* Luva / Punho Vermelho Gigante */}
          <circle cx="145" cy="48" r="28" fill="#FF3038" stroke="#111111" strokeWidth="4" />
          <ellipse cx="140" cy="35" r="12" ry="8" fill="#FF3038" stroke="#111111" strokeWidth="3" />
          {/* Brilho da luva */}
          <ellipse cx="138" cy="40" rx="8" ry="4" fill="#FFFFFF" opacity="0.6" transform="rotate(-30 138 40)" />
        </svg>
      </motion.div>

      {/* Alvo com Squash */}
      <motion.div
        animate={punched ? { x: [0, 40, 20], scaleX: [1, 0.6, 1], scaleY: [1, 1.4, 1] } : {}}
        transition={{ duration: 0.4 }}
        className="relative z-10"
      >
        <Avatar
          name={playerName}
          color={playerColor}
          status={punched ? 'hit' : 'idle'}
          size={isTelao ? 'lg' : 'md'}
        />

        {punched && (
          <div className="absolute -top-12 right-0 z-30">
            <Burst text="POW!" color="red" size="md" />
          </div>
        )}
      </motion.div>

      {damage !== null && damage !== undefined && punched && (
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
