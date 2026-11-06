'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/toon/Avatar';
import { toonAudio } from '../utils/sound';
import { DeathFxProps } from './GhostAscend';

export const SpiralSpin: React.FC<DeathFxProps> = ({
  playerName = 'Jogador',
  playerColor = '#35B8F4',
  onDone,
  isTelao = false,
}) => {
  const [vanished, setVanished] = useState(false);

  useEffect(() => {
    toonAudio.playSlideDown();
    const t1 = setTimeout(() => {
      setVanished(true);
    }, 1400);

    const tEnd = setTimeout(() => {
      onDone();
    }, 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(tEnd);
    };
  }, [onDone]);

  const scale = isTelao ? 'scale-125' : 'scale-100';

  return (
    <div className={`relative flex flex-col items-center justify-center p-6 ${scale}`}>
      {!vanished ? (
        <motion.div
          animate={{ rotate: 1080, scale: [1, 1.1, 0.1, 0], opacity: [1, 1, 0.8, 0] }}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
        >
          <Avatar name={playerName} color={playerColor} status="dead" size={isTelao ? 'lg' : 'md'} />
        </motion.div>
      ) : (
        /* Efeito de Poof de fumaça */
        <motion.div
          initial={{ scale: 0.5, opacity: 1 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl"
        >
          💨
        </motion.div>
      )}

      {/* Banner de Morte */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-4 bg-[#FF3038] text-white font-black font-[family-name:var(--font-heading)] text-base px-4 py-1.5 rounded-[12px] border-2 border-[#111111] shadow-[3px_3px_0px_#111111] uppercase tracking-wider"
      >
        💀 {playerName} GIROU ATÉ SUMIR!
      </motion.div>
    </div>
  );
};
