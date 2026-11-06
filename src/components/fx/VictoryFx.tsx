'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/toon/Avatar';
import { toonAudio } from './utils/sound';

export interface VictoryFxProps {
  winnerName?: string;
  winnerColor?: string;
  isTie?: boolean;
  tiedWinners?: { name: string; color: string }[];
  onDone?: () => void;
  isTelao?: boolean;
}

export const VictoryFx: React.FC<VictoryFxProps> = ({
  winnerName = 'Campeão',
  winnerColor = '#FFC233',
  isTie = false,
  tiedWinners = [],
  onDone,
  isTelao = false,
}) => {
  useEffect(() => {
    toonAudio.playVictory();
    if (onDone) {
      const timer = setTimeout(onDone, 5000);
      return () => clearTimeout(timer);
    }
  }, [onDone]);

  // Gerador de partículas de confetes cartoon SVG
  const confettiPieces = Array.from({ length: 24 }).map((_, i) => ({
    id: i,
    x: (i % 8) * 45 - 160,
    y: -80 - Math.floor(i / 8) * 40,
    color: ['#FF3038', '#35B8F4', '#FFC233', '#2ECC71', '#8E5CF7', '#FF4FA3'][i % 6] ?? '#FF3038',
    rotate: (i * 35) % 360,
    size: 10 + (i % 6) * 3,
  }));

  const scale = isTelao ? 'scale-125' : 'scale-100';

  return (
    <div className={`relative flex flex-col items-center justify-center p-8 overflow-hidden ${scale}`}>
      {/* Chuva de Confetes Cartoon SVG */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0">
        {confettiPieces.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: p.y, x: p.x, opacity: 0, rotate: 0 }}
            animate={{
              y: [p.y, 160],
              x: [p.x, p.x + (p.id % 2 === 0 ? 30 : -30)],
              opacity: [0, 1, 1, 0],
              rotate: [0, p.rotate + 360],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              delay: (p.id % 8) * 0.15,
              ease: 'easeOut',
            }}
            className="absolute rounded-[3px] border border-[#111111]"
            style={{
              width: p.size,
              height: p.size * 0.7,
              backgroundColor: p.color,
            }}
          />
        ))}
      </div>

      {/* Caso Empate: Vários sobreviventes que caíram juntos */}
      {isTie ? (
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-4">
            {tiedWinners.map((w, idx) => (
              <Avatar
                key={idx}
                name={w.name}
                color={w.color}
                status="win"
                size={isTelao ? 'lg' : 'md'}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.05, 1], opacity: 1 }}
            className="bg-[#8E5CF7] text-white font-black font-[family-name:var(--font-heading)] text-xl sm:text-2xl px-6 py-2 rounded-[16px] border-3 border-[#111111] shadow-[4px_4px_0px_#111111] tracking-wider text-center"
          >
            🤝 EMPATE! TODOS CAÍRAM JUNTOS!
          </motion.div>
        </div>
      ) : (
        /* Caso Vencedor Único */
        <div className="relative z-10 flex flex-col items-center">
          {/* Coroa Gigante Flutuante */}
          <motion.div
            animate={{ y: [0, -8, 0], rotate: [-4, 4, -4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="mb-1 filter drop-shadow-[4px_4px_0px_#111111]"
          >
            <svg width="60" height="42" viewBox="0 0 60 42">
              <path
                d="M 5 38 L 8 10 L 22 25 L 30 5 L 38 25 L 52 10 L 55 38 Z"
                fill="#FFC233"
                stroke="#111111"
                strokeWidth="4"
                strokeLinejoin="round"
              />
              <circle cx="8" cy="10" r="4" fill="#FFFFFF" stroke="#111111" strokeWidth="2" />
              <circle cx="30" cy="5" r="4" fill="#FFFFFF" stroke="#111111" strokeWidth="2" />
              <circle cx="52" cy="10" r="4" fill="#FFFFFF" stroke="#111111" strokeWidth="2" />
            </svg>
          </motion.div>

          {/* Avatar do Campeão com Salto Comemorativo */}
          <motion.div
            animate={{ y: [0, -18, 0], scaleY: [1, 1.1, 0.95, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Avatar
              name={winnerName}
              color={winnerColor}
              status="win"
              size={isTelao ? 'lg' : 'md'}
              isHost
            />
          </motion.div>

          {/* Faixa de Vitória */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 350, damping: 15 }}
            className="mt-4 bg-[#FFC233] text-[#111111] font-black font-[family-name:var(--font-comic)] text-2xl sm:text-3xl px-6 py-2 rounded-[16px] border-3 border-[#111111] shadow-[5px_5px_0px_#111111] uppercase tracking-wider text-center"
          >
            👑 CAMPEÃO DA ARENA!
          </motion.div>
        </div>
      )}
    </div>
  );
};
