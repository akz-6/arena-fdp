'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/toon/Avatar';
import { toonAudio } from '../utils/sound';
import { DeathFxProps } from './GhostAscend';

export const HoleFall: React.FC<DeathFxProps> = ({
  playerName = 'Jogador',
  playerColor = '#35B8F4',
  onDone,
  isTelao = false,
}) => {
  const [falling, setFalling] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    toonAudio.playSlideDown();
    const t1 = setTimeout(() => {
      setFalling(true);
    }, 600);

    const t2 = setTimeout(() => {
      setClosed(true);
    }, 1500);

    const tEnd = setTimeout(() => {
      onDone();
    }, 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(tEnd);
    };
  }, [onDone]);

  const scale = isTelao ? 'scale-125' : 'scale-100';

  return (
    <div className={`relative flex flex-col items-center justify-center p-6 ${scale}`}>
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Buraco Cartoon no Chão */}
        <motion.div
          initial={{ scaleX: 0, scaleY: 0 }}
          animate={closed ? { scaleX: 0, scaleY: 0 } : { scaleX: 1, scaleY: 1 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-6 w-32 h-10 bg-[#111111] rounded-full border-2 border-[#333333] shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)] z-0"
        />

        {/* Personagem Caindo */}
        {!closed && (
          <motion.div
            animate={
              falling
                ? { y: [0, 80], scale: [1, 0.2], opacity: [1, 0] }
                : { y: [0, -5, 0] }
            }
            transition={{ duration: 0.7, ease: 'easeIn' }}
            className="relative z-10"
          >
            <Avatar name={playerName} color={playerColor} status="dead" size={isTelao ? 'lg' : 'md'} />
          </motion.div>
        )}

        {/* Som de Pop quando fecha */}
        {closed && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 0] }}
            className="text-2xl font-black text-[#111111] font-[family-name:var(--font-comic)] z-20"
          >
            POP!
          </motion.div>
        )}
      </div>

      {/* Banner de Morte */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-2 bg-[#FF3038] text-white font-black font-[family-name:var(--font-heading)] text-base px-4 py-1.5 rounded-[12px] border-2 border-[#111111] shadow-[3px_3px_0px_#111111] uppercase tracking-wider"
      >
        💀 {playerName} CAIU NO BURACO!
      </motion.div>
    </div>
  );
};
