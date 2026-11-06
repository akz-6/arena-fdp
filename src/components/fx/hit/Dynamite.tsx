'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Burst } from '@/components/toon/Burst';
import { Avatar } from '@/components/toon/Avatar';
import { toonAudio } from '../utils/sound';
import { useShake } from '../utils/ScreenShake';
import { HitFxProps } from './GunShot';

export const Dynamite: React.FC<HitFxProps> = ({
  playerName = 'Jogador',
  playerColor = '#35B8F4',
  damage,
  onDone,
  isTelao = false,
}) => {
  const { shake } = useShake();
  const [exploded, setExploded] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setExploded(true);
      toonAudio.playExplosion();
      shake('heavy');
    }, 550);

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
      {/* Bastão de Dinamite com Pavio Aceso */}
      {!exploded && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute z-20 top-1/2 -translate-y-1/2 -left-8 pointer-events-none"
        >
          <svg width="60" height="70" viewBox="0 0 60 70">
            {/* Tubo de dinamite */}
            <rect x="20" y="25" width="22" height="42" rx="4" fill="#FF3038" stroke="#111111" strokeWidth="3" />
            <line x1="20" y1="36" x2="42" y2="36" stroke="#111111" strokeWidth="2" />
            <line x1="20" y1="52" x2="42" y2="52" stroke="#111111" strokeWidth="2" />
            <text x="23" y="46" fill="#FFFFFF" fontSize="8" fontWeight="bold">TNT</text>
            {/* Pavio */}
            <path d="M 31 25 Q 26 12 36 6" fill="none" stroke="#D1D5DB" strokeWidth="2.5" />
            {/* Faísca */}
            <circle cx="36" cy="6" r="4" fill="#FFC233" />
            <circle cx="36" cy="6" r="2" fill="#FFFFFF" />
          </svg>
        </motion.div>
      )}

      {/* Alvo com Cara Chamuscada */}
      <div className="relative z-10">
        <Avatar
          name={playerName}
          color={exploded ? '#333333' : playerColor} // Chamuscado de preto/cinza
          status={exploded ? 'hit' : 'idle'}
          size={isTelao ? 'lg' : 'md'}
        />

        {exploded && (
          <>
            <div className="absolute -top-12 -right-10 z-30">
              <Burst text="BOOM!" color="orange" size="md" />
            </div>

            {/* Fumaça subindo */}
            <motion.div
              animate={{ y: [-10, -40], opacity: [1, 0], scale: [0.8, 1.4] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="absolute -top-8 left-1/2 -translate-x-1/2 text-2xl pointer-events-none"
            >
              💨
            </motion.div>
          </>
        )}
      </div>

      {damage !== null && damage !== undefined && exploded && (
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
