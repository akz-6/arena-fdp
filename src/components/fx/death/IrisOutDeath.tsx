'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/toon/Avatar';
import { toonAudio } from '../utils/sound';
import { DeathFxProps } from './GhostAscend';

export const IrisOutDeath: React.FC<DeathFxProps> = ({
  playerName = 'Jogador',
  playerColor = '#35B8F4',
  onDone,
  isTelao = false,
}) => {
  useEffect(() => {
    toonAudio.playSlideDown();
    const timer = setTimeout(() => {
      onDone();
    }, 3200);

    return () => clearTimeout(timer);
  }, [onDone]);

  const scale = isTelao ? 'scale-125' : 'scale-100';

  return (
    <div className={`relative flex flex-col items-center justify-center p-6 ${scale}`}>
      {/* Alvo Central */}
      <div className="relative z-10">
        <Avatar name={playerName} color={playerColor} status="dead" size={isTelao ? 'lg' : 'md'} />
      </div>

      {/* Íris Circular se Fechando (Máscara Toon) */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20 overflow-hidden">
        <motion.div
          initial={{ scale: 3, opacity: 0 }}
          animate={{ scale: [3, 1, 0.4, 0], opacity: [0, 1, 1, 1] }}
          transition={{ duration: 2.2, times: [0, 0.3, 0.7, 1], ease: 'easeInOut' }}
          className="w-80 h-80 rounded-full border-[100px] border-[#111111]"
        />
      </div>

      {/* Texto Clássico "FIM!" */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.6, type: 'spring', stiffness: 400, damping: 15 }}
        className="absolute z-30 font-[family-name:var(--font-comic)] text-4xl text-[#FFC233] drop-shadow-[3px_3px_0px_#111111]"
      >
        FIM!
      </motion.div>

      {/* Banner de Morte */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 bg-[#FF3038] text-white font-black font-[family-name:var(--font-heading)] text-base px-4 py-1.5 rounded-[12px] border-2 border-[#111111] shadow-[3px_3px_0px_#111111] uppercase tracking-wider z-10"
      >
        💀 {playerName} ELIMINADO!
      </motion.div>
    </div>
  );
};
