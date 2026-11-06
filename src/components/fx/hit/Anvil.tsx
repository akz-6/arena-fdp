'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Burst } from '@/components/toon/Burst';
import { Avatar } from '@/components/toon/Avatar';
import { toonAudio } from '../utils/sound';
import { useShake } from '../utils/ScreenShake';
import { HitFxProps } from './GunShot';

export const Anvil: React.FC<HitFxProps> = ({
  playerName = 'Jogador',
  playerColor = '#35B8F4',
  damage,
  onDone,
  isTelao = false,
}) => {
  const { shake } = useShake();
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setLanded(true);
      toonAudio.playExplosion();
      shake('heavy');
    }, 450);

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
      {/* Bigorna Cartoon Caindo */}
      <motion.div
        initial={{ y: -200, opacity: 0 }}
        animate={landed ? { y: -25, opacity: 1 } : { y: -150, opacity: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 450 }}
        className="absolute top-1/2 -translate-y-full z-20 pointer-events-none"
      >
        <svg width="100" height="70" viewBox="0 0 100 70" className="drop-shadow-[4px_4px_0px_#111111]">
          {/* Base e Corpo da Bigorna */}
          <path
            d="M 20 60 L 80 60 L 72 45 L 92 45 Q 98 30 85 20 L 15 20 Q 5 25 10 35 L 28 45 Z"
            fill="#4B5563"
            stroke="#111111"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Chifre da Bigorna */}
          <path d="M 85 20 Q 98 25 95 32 L 80 32 Z" fill="#6B7280" stroke="#111111" strokeWidth="2" />
          {/* Letras cartoon "100 KG" */}
          <text
            x="36"
            y="42"
            fill="#FFFFFF"
            fontSize="10"
            fontWeight="900"
            fontFamily="sans-serif"
          >
            100 KG
          </text>
        </svg>
      </motion.div>

      {/* Alvo Achatado com Estrelinhas */}
      <motion.div
        animate={landed ? { scaleY: [1, 0.45, 0.9], scaleX: [1, 1.4, 1.05] } : {}}
        transition={{ duration: 0.35 }}
        className="relative z-10"
      >
        <Avatar
          name={playerName}
          color={playerColor}
          status={landed ? 'hit' : 'idle'}
          size={isTelao ? 'lg' : 'md'}
        />

        {landed && (
          <div className="absolute -top-12 -right-8 z-30">
            <Burst text="CLANG!" color="orange" size="md" />
          </div>
        )}
      </motion.div>

      {damage !== null && damage !== undefined && landed && (
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
