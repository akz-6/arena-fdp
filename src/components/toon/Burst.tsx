'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface BurstProps {
  text: string;
  color?: 'yellow' | 'red' | 'orange' | 'blue';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Burst: React.FC<BurstProps> = ({
  text,
  color = 'yellow',
  size = 'md',
  className = '',
}) => {
  const fillColor = {
    yellow: '#FFC233',
    red: '#FF3038',
    orange: '#FF9500',
    blue: '#35B8F4',
  }[color];

  const textColor = color === 'red' ? '#FFFFFF' : '#111111';

  const sizePixels = {
    sm: 70,
    md: 100,
    lg: 140,
  }[size];

  const fontSize = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  }[size];

  return (
    <motion.div
      initial={{ scale: 0.8, rotate: -6 }}
      animate={{ scale: [0.8, 1.05, 1], rotate: [-6, 3, 0] }}
      transition={{ duration: 0.3, type: 'spring', stiffness: 400 }}
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: sizePixels, height: sizePixels }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible drop-shadow-[3px_3px_0px_#111111]"
      >
        {/* Polígono estrelado pontudo de quadrinhos */}
        <polygon
          points="50,2 62,28 92,15 78,42 98,62 68,68 68,98 48,78 28,95 32,68 4,60 25,40 8,15 38,26"
          fill={fillColor}
          stroke="#111111"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={`absolute font-black tracking-wider uppercase font-[family-name:var(--font-comic)] drop-shadow-[1px_1px_0px_rgba(0,0,0,0.5)] ${fontSize}`}
        style={{ color: textColor }}
      >
        {text}
      </span>
    </motion.div>
  );
};
