'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Burst } from '@/components/toon/Burst';
import { Avatar } from '@/components/toon/Avatar';
import { toonAudio } from '../utils/sound';
import { useShake } from '../utils/ScreenShake';
import { HitFxProps } from './GunShot';

export const FallingPiano: React.FC<HitFxProps> = ({
  playerName = 'Jogador',
  playerColor = '#35B8F4',
  damage,
  onDone,
  isTelao = false,
}) => {
  const { shake } = useShake();
  const [crushed, setCrushed] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setCrushed(true);
      toonAudio.playExplosion();
      shake('heavy');
    }, 450);

    const tEnd = setTimeout(() => {
      onDone();
    }, 2600);

    return () => {
      clearTimeout(t1);
      clearTimeout(tEnd);
    };
  }, [onDone, shake]);

  const scale = isTelao ? 'scale-125' : 'scale-100';

  return (
    <div className={`relative flex flex-col items-center justify-center p-6 ${scale}`}>
      {/* Piano de Cauda Caindo do Céu */}
      <motion.div
        initial={{ y: -220, opacity: 0 }}
        animate={crushed ? { y: -30, opacity: 1 } : { y: -160, opacity: 1 }}
        transition={{ type: 'spring', damping: 13, stiffness: 400 }}
        className="absolute top-1/2 -translate-y-full z-20 pointer-events-none"
      >
        <svg width="120" height="90" viewBox="0 0 120 90" className="drop-shadow-[5px_5px_0px_#111111]">
          {/* Caixa do Piano */}
          <path
            d="M 15 70 L 105 70 L 105 35 Q 85 10 45 15 L 15 25 Z"
            fill="#111111"
            stroke="#111111"
            strokeWidth="3.5"
          />
          {/* Teclas Brancas e Pretas */}
          <rect x="25" y="65" width="70" height="15" fill="#FFFFFF" stroke="#111111" strokeWidth="2" />
          <line x1="35" y1="65" x2="35" y2="80" stroke="#111111" strokeWidth="1.5" />
          <line x1="45" y1="65" x2="45" y2="80" stroke="#111111" strokeWidth="1.5" />
          <line x1="55" y1="65" x2="55" y2="80" stroke="#111111" strokeWidth="1.5" />
          <line x1="65" y1="65" x2="65" y2="80" stroke="#111111" strokeWidth="1.5" />
          <line x1="75" y1="65" x2="75" y2="80" stroke="#111111" strokeWidth="1.5" />
          <line x1="85" y1="65" x2="85" y2="80" stroke="#111111" strokeWidth="1.5" />
          {/* Pés do Piano */}
          <rect x="20" y="70" width="8" height="16" fill="#111111" />
          <rect x="92" y="70" width="8" height="16" fill="#111111" />
        </svg>
      </motion.div>

      {/* Alvo Esmagado */}
      <div className="relative z-10">
        <motion.div
          animate={crushed ? { scaleY: [1, 0.4, 0.8], scaleX: [1, 1.4, 1.1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Avatar
            name={playerName}
            color={playerColor}
            status={crushed ? 'hit' : 'idle'}
            size={isTelao ? 'lg' : 'md'}
          />
        </motion.div>

        {crushed && (
          <>
            <div className="absolute -top-12 -right-12 z-30">
              <Burst text="PLANK!" color="red" size="md" />
            </div>

            {/* Teclinha voando */}
            <motion.div
              animate={{ y: [-10, -35], x: [0, 25], rotate: [0, 180], opacity: [1, 0] }}
              transition={{ duration: 0.8 }}
              className="absolute -top-6 right-2 text-base pointer-events-none"
            >
              🎹
            </motion.div>
          </>
        )}
      </div>

      {damage !== null && damage !== undefined && crushed && (
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
