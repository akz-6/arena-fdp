'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/toon/Avatar';
import { toonAudio } from '../utils/sound';
import { DeathFxProps } from './GhostAscend';

export const PancakeCrumble: React.FC<DeathFxProps> = ({
  playerName = 'Jogador',
  playerColor = '#35B8F4',
  onDone,
  isTelao = false,
}) => {
  const [crumbled, setCrumbled] = useState(false);

  useEffect(() => {
    toonAudio.playSlideDown();
    const t1 = setTimeout(() => {
      setCrumbled(true);
    }, 700);

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
      {!crumbled ? (
        <motion.div
          animate={{ scaleY: [1, 0.25], scaleX: [1, 1.6], y: [0, 20] }}
          transition={{ duration: 0.6, ease: 'easeIn' }}
        >
          <Avatar name={playerName} color={playerColor} status="dead" size={isTelao ? 'lg' : 'md'} />
        </motion.div>
      ) : (
        /* Pedacinhos Desmontando */
        <div className="relative w-32 h-20 flex items-center justify-center">
          <motion.div
            animate={{ x: -40, y: 30, rotate: -45, opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="w-8 h-8 rounded-full border-2 border-[#111111] absolute"
            style={{ backgroundColor: playerColor }}
          />
          <motion.div
            animate={{ x: 40, y: 30, rotate: 45, opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="w-8 h-8 rounded-full border-2 border-[#111111] absolute"
            style={{ backgroundColor: playerColor }}
          />
          <motion.div
            animate={{ x: 0, y: 45, rotate: 90, opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="w-10 h-6 rounded-full border-2 border-[#111111] absolute"
            style={{ backgroundColor: playerColor }}
          />
          <span className="text-xl absolute -top-4">💥</span>
        </div>
      )}

      {/* Banner de Morte */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-4 bg-[#FF3038] text-white font-black font-[family-name:var(--font-heading)] text-base px-4 py-1.5 rounded-[12px] border-2 border-[#111111] shadow-[3px_3px_0px_#111111] uppercase tracking-wider"
      >
        💀 {playerName} DESMONTOU!
      </motion.div>
    </div>
  );
};
