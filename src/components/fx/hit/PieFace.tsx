'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Burst } from '@/components/toon/Burst';
import { Avatar } from '@/components/toon/Avatar';
import { toonAudio } from '../utils/sound';
import { useShake } from '../utils/ScreenShake';
import { HitFxProps } from './GunShot';

export const PieFace: React.FC<HitFxProps> = ({
  playerName = 'Jogador',
  playerColor = '#35B8F4',
  damage,
  onDone,
  isTelao = false,
}) => {
  const { shake } = useShake();
  const [splatted, setSplatted] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setSplatted(true);
      toonAudio.playBonk();
      shake('medium');
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
      {/* Torta Voando */}
      {!splatted && (
        <motion.div
          initial={{ x: -160, y: -40, rotate: -25 }}
          animate={{ x: 0, y: 0, rotate: 10 }}
          transition={{ duration: 0.45, ease: 'easeIn' }}
          className="absolute z-20 pointer-events-none"
        >
          <svg width="70" height="50" viewBox="0 0 70 50">
            {/* Prato de Alumínio */}
            <ellipse cx="35" cy="40" rx="30" ry="8" fill="#D1D5DB" stroke="#111111" strokeWidth="2.5" />
            {/* Massa da Torta */}
            <path d="M 12 36 Q 35 15 58 36 Z" fill="#FBBF24" stroke="#111111" strokeWidth="2.5" />
            {/* Chantilly e Cereja */}
            <ellipse cx="35" cy="22" rx="14" ry="8" fill="#FFFFFF" stroke="#111111" strokeWidth="2" />
            <circle cx="35" cy="14" r="5" fill="#FF3038" stroke="#111111" strokeWidth="2" />
          </svg>
        </motion.div>
      )}

      {/* Alvo com Chantilly Espalhado no Rosto */}
      <div className="relative z-10">
        <Avatar
          name={playerName}
          color={playerColor}
          status={splatted ? 'hit' : 'idle'}
          size={isTelao ? 'lg' : 'md'}
        />

        {splatted && (
          <>
            {/* Splash de Chantilly */}
            <motion.div
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
            >
              <svg width="90" height="90" viewBox="0 0 90 90" className="drop-shadow-[2px_2px_0px_#111111]">
                <path
                  d="M 45 15 Q 55 5 65 20 Q 80 18 80 32 Q 90 45 78 58 Q 85 75 70 78 Q 55 88 45 75 Q 30 85 20 72 Q 5 65 15 48 Q 5 32 20 25 Q 25 8 45 15 Z"
                  fill="#FFFFFF"
                  stroke="#111111"
                  strokeWidth="3.5"
                />
                {/* Cereja escorrendo */}
                <circle cx="50" cy="40" r="7" fill="#FF3038" stroke="#111111" strokeWidth="2" />
              </svg>
            </motion.div>

            <div className="absolute -top-10 -right-10 z-30">
              <Burst text="SPLAT!" color="yellow" size="sm" />
            </div>
          </>
        )}
      </div>

      {damage !== null && damage !== undefined && splatted && (
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
