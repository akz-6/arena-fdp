'use client';

import React from 'react';

export type BadgeVariant =
  | 'host'
  | 'online'
  | 'dead'
  | 'winner'
  | 'spectator'
  | 'playing'
  | 'default';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  label?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  label,
  children,
  size = 'sm',
  className = '',
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    host: 'bg-[#FFC233] text-[#111111]', // Amarelo
    online: 'bg-[#2ECC71] text-[#111111]', // Verde
    dead: 'bg-[#FF3038] text-white', // Vermelho
    winner: 'bg-[#8E5CF7] text-white', // Roxo / Dourado
    spectator: 'bg-[#F5F5F5] text-[#666666]', // Cinza
    playing: 'bg-[#35B8F4] text-[#111111]', // Azul
    default: 'bg-white text-[#111111]',
  };

  const defaultLabels: Record<BadgeVariant, string> = {
    host: '👑 HOST',
    online: '● ONLINE',
    dead: '💀 ELIMINADO',
    winner: '🏆 VENCEDOR',
    spectator: '👀 OBSERVADOR',
    playing: '🃏 JOGANDO',
    default: '',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5 rounded-[8px]',
    md: 'text-sm px-3.5 py-1 rounded-[10px]',
  }[size];

  const content = children || label || defaultLabels[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold font-[family-name:var(--font-heading)] uppercase tracking-wider border-2 border-[#111111] shadow-[2px_2px_0px_#111111] select-none ${variantStyles[variant]} ${sizeStyles} ${className}`}
      {...props}
    >
      {content}
    </span>
  );
};
