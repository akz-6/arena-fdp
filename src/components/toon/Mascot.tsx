'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export interface MascotProps {
  size?: 'sm' | 'md' | 'lg';
  speech?: string;
  className?: string;
}

export const Mascot: React.FC<MascotProps> = ({
  size = 'md',
  speech,
  className = '',
}) => {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 3500);

    return () => clearInterval(blinkInterval);
  }, []);

  const sizePixels = {
    sm: 90,
    md: 140,
    lg: 190,
  }[size];

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* Balão de Fala Opcional */}
      {speech && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="mb-2 bg-white px-4 py-2 rounded-[16px] border-2 border-[#111111] shadow-[3px_3px_0px_#111111] font-[family-name:var(--font-heading)] font-bold text-sm text-[#111111] relative"
        >
          {speech}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b-2 border-r-2 border-[#111111] rotate-45" />
        </motion.div>
      )}

      {/* Mascote Animado Original */}
      <motion.div
        animate={{
          y: [0, -6, 0],
          scaleY: [1, 1.02, 1],
          scaleX: [1, 0.98, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ width: sizePixels, height: sizePixels }}
        className="relative"
      >
        <svg
          viewBox="0 0 160 160"
          className="w-full h-full overflow-visible drop-shadow-[4px_4px_0px_#111111]"
        >
          {/* Sombra de chão */}
          <ellipse cx="80" cy="148" rx="55" ry="10" fill="#111111" opacity="0.15" />

          {/* Corpo do Mascote (Blob Branco Toon) */}
          <path
            d="M 80 18 C 125 18 142 45 142 90 C 142 135 125 142 80 142 C 35 142 18 135 18 90 C 18 45 35 18 80 18 Z"
            fill="#FFFFFF"
            stroke="#111111"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Destaque / Brilho cartoon no topo */}
          <ellipse cx="55" cy="40" rx="14" ry="7" fill="#F5F5F5" transform="rotate(-25 55 40)" />

          {/* Cartinha na cabeça (estilo Arena FDP) */}
          <g transform="translate(68, 6) rotate(12)">
            <rect
              x="0"
              y="0"
              width="24"
              height="32"
              rx="4"
              fill="#FFFFFF"
              stroke="#111111"
              strokeWidth="3"
            />
            <path
              d="M 12 10 L 8 16 L 16 16 Z"
              fill="#FF3038"
            />
            <circle cx="12" cy="20" r="3" fill="#FF3038" />
          </g>

          {/* Olho Esquerdo */}
          <g transform="translate(56, 75)">
            <ellipse
              cx="0"
              cy="0"
              rx="11"
              ry={isBlinking ? '1.5' : '16'}
              fill="#111111"
            />
            {!isBlinking && (
              <>
                <circle cx="-3" cy="-5" r="4" fill="#FFFFFF" />
                <circle cx="3" cy="4" r="2" fill="#FFFFFF" />
              </>
            )}
          </g>

          {/* Olho Direito */}
          <g transform="translate(104, 75)">
            <ellipse
              cx="0"
              cy="0"
              rx="11"
              ry={isBlinking ? '1.5' : '16'}
              fill="#111111"
            />
            {!isBlinking && (
              <>
                <circle cx="-3" cy="-5" r="4" fill="#FFFFFF" />
                <circle cx="3" cy="4" r="2" fill="#FFFFFF" />
              </>
            )}
          </g>

          {/* Bochechinhas rosadas */}
          <ellipse cx="38" cy="94" rx="8" ry="5" fill="#FF4FA3" opacity="0.6" />
          <ellipse cx="122" cy="94" rx="8" ry="5" fill="#FF4FA3" opacity="0.6" />

          {/* Boca Alegre */}
          <path
            d="M 68 98 Q 80 114 92 98"
            fill="none"
            stroke="#111111"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>
    </div>
  );
};
