'use client';

import React from 'react';

export interface SpeechBubbleProps {
  children: React.ReactNode;
  position?: 'bottom' | 'top' | 'left' | 'right';
  className?: string;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  children,
  position = 'bottom',
  className = '',
}) => {
  const tailPosition = {
    bottom: 'bottom-[-9px] left-1/2 -translate-x-1/2 border-b-2 border-r-2 rotate-45',
    top: 'top-[-9px] left-1/2 -translate-x-1/2 border-t-2 border-l-2 rotate-45',
    left: 'left-[-9px] top-1/2 -translate-y-1/2 border-b-2 border-l-2 rotate-45',
    right: 'right-[-9px] top-1/2 -translate-y-1/2 border-t-2 border-r-2 rotate-45',
  }[position];

  return (
    <div
      className={`relative inline-block bg-white text-[#111111] font-[family-name:var(--font-heading)] font-bold text-sm px-4 py-2.5 rounded-[18px] border-2 border-[#111111] shadow-[3px_3px_0px_#111111] select-none ${className}`}
    >
      {children}
      <div
        className={`absolute w-3.5 h-3.5 bg-white border-[#111111] ${tailPosition}`}
      />
    </div>
  );
};
