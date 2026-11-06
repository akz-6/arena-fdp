'use client';

import React from 'react';
import { motion } from 'framer-motion';

export type AvatarStatus = 'idle' | 'hit' | 'dead' | 'win' | 'away';
export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  color?: string;
  name?: string;
  status?: AvatarStatus;
  size?: AvatarSize;
  isHost?: boolean;
  lives?: number | null;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  color = '#35B8F4',
  name,
  status = 'idle',
  size = 'md',
  isHost = false,
  lives = null,
  className = '',
}) => {
  const sizePixels = {
    sm: 52,
    md: 80,
    lg: 110,
  }[size];

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <div
        className="relative flex items-center justify-center"
        style={{ width: sizePixels, height: sizePixels }}
      >
        {/* Coroa de Host */}
        {isHost && (
          <div className="absolute -top-3.5 z-10 filter drop-shadow-[2px_2px_0px_#111111]">
            <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
              <path
                d="M 2 18 L 4 5 L 10 12 L 14 2 L 18 12 L 24 5 L 26 18 Z"
                fill="#FFC233"
                stroke="#111111"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <circle cx="4" cy="5" r="2" fill="#FFFFFF" stroke="#111111" strokeWidth="1" />
              <circle cx="14" cy="2" r="2" fill="#FFFFFF" stroke="#111111" strokeWidth="1" />
              <circle cx="24" cy="5" r="2" fill="#FFFFFF" stroke="#111111" strokeWidth="1" />
            </svg>
          </div>
        )}

        {/* SVG do Personagem Original */}
        <motion.div
          animate={
            status === 'dead'
              ? { rotate: [0, 90], y: 10, opacity: 0.6 }
              : status === 'hit'
              ? { scale: [1, 1.2, 0.9, 1], rotate: [-8, 8, -4, 0] }
              : status === 'win'
              ? { y: [0, -10, 0], scale: [1, 1.05, 1] }
              : { y: [0, -3, 0] }
          }
          transition={{
            duration: status === 'idle' ? 2.5 : 0.4,
            repeat: status === 'idle' || status === 'win' ? Infinity : 0,
            ease: 'easeInOut',
          }}
          className="w-full h-full relative"
        >
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full overflow-visible drop-shadow-[3px_3px_0px_#111111]"
          >
            {/* Corpo Blob Toon na cor do jogador */}
            <path
              d="M 50 10 C 80 10 92 28 92 56 C 92 84 80 92 50 92 C 20 92 8 84 8 56 C 8 28 20 10 50 10 Z"
              fill={status === 'away' ? '#888888' : color}
              stroke="#111111"
              strokeWidth="4"
              strokeLinejoin="round"
            />

            {/* Brilho cartoon */}
            <ellipse
              cx="32"
              cy="24"
              rx="8"
              ry="4"
              fill="rgba(255,255,255,0.4)"
              transform="rotate(-20 32 24)"
            />

            {/* Olhos e Expressão conforme status */}
            {status === 'dead' ? (
              // Olhos em X (Morto)
              <g stroke="#111111" strokeWidth="3.5" strokeLinecap="round">
                <line x1="30" y1="42" x2="42" y2="54" />
                <line x1="42" y1="42" x2="30" y2="54" />

                <line x1="58" y1="42" x2="70" y2="54" />
                <line x1="70" y1="42" x2="58" y2="54" />

                {/* Língua de fora ou boca caída */}
                <path d="M 42 68 Q 50 62 58 68" fill="none" stroke="#111111" strokeWidth="3" />
              </g>
            ) : status === 'away' ? (
              // Olhos fechados dormindo zZ
              <g>
                <path
                  d="M 28 48 Q 36 55 44 48"
                  fill="none"
                  stroke="#111111"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 56 48 Q 64 55 72 48"
                  fill="none"
                  stroke="#111111"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <text
                  x="74"
                  y="30"
                  fill="#111111"
                  fontSize="16"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  zZ
                </text>
              </g>
            ) : (
              // Olhos Normais / Expressivos
              <g>
                {/* Olho Esquerdo */}
                <ellipse cx="36" cy="48" rx="8" ry="11" fill="#FFFFFF" stroke="#111111" strokeWidth="2.5" />
                <circle cx="37" cy="48" r="4.5" fill="#111111" />
                <circle cx="35" cy="45" r="1.5" fill="#FFFFFF" />

                {/* Olho Direito */}
                <ellipse cx="64" cy="48" rx="8" ry="11" fill="#FFFFFF" stroke="#111111" strokeWidth="2.5" />
                <circle cx="63" cy="48" r="4.5" fill="#111111" />
                <circle cx="61" cy="45" r="1.5" fill="#FFFFFF" />

                {/* Boca */}
                <path
                  d={
                    status === 'win'
                      ? 'M 40 64 Q 50 78 60 64 Z'
                      : 'M 42 66 Q 50 74 58 66'
                  }
                  fill={status === 'win' ? '#FF3038' : 'none'}
                  stroke="#111111"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>
            )}
          </svg>
        </motion.div>

        {/* Selo de Vidas (somente se vidas !== null) */}
        {lives !== null && (
          <div className="absolute -bottom-1 -right-1 bg-[#FF3038] text-white text-xs font-black font-[family-name:var(--font-heading)] px-1.5 py-0.5 rounded-full border-2 border-[#111111] shadow-[1px_1px_0px_#111111] flex items-center gap-0.5 z-10">
            <span>❤️</span>
            <span>{lives}</span>
          </div>
        )}
      </div>

      {/* Nome do Jogador */}
      {name && (
        <span className="mt-1 text-xs sm:text-sm font-bold text-[#111111] font-[family-name:var(--font-heading)] max-w-[90px] truncate text-center">
          {name}
        </span>
      )}
    </div>
  );
};
