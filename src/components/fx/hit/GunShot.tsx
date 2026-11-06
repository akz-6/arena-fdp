'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Burst } from '@/components/toon/Burst';
import { Avatar } from '@/components/toon/Avatar';
import { toonAudio } from '../utils/sound';
import { useShake } from '../utils/ScreenShake';

export interface HitFxProps {
  playerName?: string;
  playerColor?: string;
  damage?: number | null;
  seed?: number;
  onDone: () => void;
  isTelao?: boolean;
}

export const GunShot: React.FC<HitFxProps> = ({
  playerName = 'Jogador',
  playerColor = '#35B8F4',
  damage,
  onDone,
  isTelao = false,
}) => {
  const { shake } = useShake();
  const [stage, setStage] = useState<'aim' | 'shot' | 'hit'>('aim');

  useEffect(() => {
    // Cronograma do Efeito
    const t1 = setTimeout(() => {
      setStage('shot');
      toonAudio.playBonk();
      shake('medium');
    }, 400);

    const t2 = setTimeout(() => {
      setStage('hit');
    }, 800);

    const tEnd = setTimeout(() => {
      onDone();
    }, 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(tEnd);
    };
  }, [onDone, shake]);

  const scale = isTelao ? 'scale-125' : 'scale-100';

  return (
    <div className={`relative flex flex-col items-center justify-center p-6 ${scale}`}>
      {/* Arma Cartoon com Bandeirinha BANG */}
      <motion.div
        initial={{ x: -160, opacity: 0, rotate: -15 }}
        animate={{ x: -70, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 15 }}
        className="absolute left-1/2 -translate-x-full top-1/2 -translate-y-1/2 z-20 pointer-events-none"
      >
        <svg width="120" height="80" viewBox="0 0 120 80" className="drop-shadow-[3px_3px_0px_#111111]">
          {/* Cabo de Madeira */}
          <path d="M 15 50 Q 5 65 18 75 Q 32 75 35 55 Z" fill="#8B5E3C" stroke="#111111" strokeWidth="3" />
          {/* Corpo do Cano */}
          <rect x="25" y="32" width="60" height="20" rx="3" fill="#6B7280" stroke="#111111" strokeWidth="3.5" />
          <rect x="75" y="30" width="12" height="24" rx="2" fill="#111111" />
          {/* Gatilho */}
          <path d="M 38 52 Q 42 60 46 52" fill="none" stroke="#111111" strokeWidth="3" />
        </svg>

        {/* Bandeirinha BANG! que salta do cano */}
        {stage !== 'aim' && (
          <motion.div
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            className="absolute left-[85px] top-[32px] z-30"
          >
            <div className="bg-[#FF3038] text-white font-[family-name:var(--font-comic)] text-sm font-black px-3 py-1 rounded-[4px] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] whitespace-nowrap">
              BANG!
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Personagem Alvo */}
      <div className="relative z-10">
        <Avatar
          name={playerName}
          color={playerColor}
          status={stage === 'hit' ? 'hit' : 'idle'}
          size={isTelao ? 'lg' : 'md'}
        />

        {/* Efeito de Dano / Onomatopeia */}
        {stage === 'hit' && (
          <div className="absolute -top-10 -right-10 z-30">
            <Burst text="AI!" color="yellow" size="sm" />
          </div>
        )}
      </div>

      {/* Dano Numérico se disponível */}
      {damage !== null && damage !== undefined && stage === 'hit' && (
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
