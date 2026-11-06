'use client';

import React from 'react';

export interface ToonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  rotate?: 'none' | 'left' | 'right';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export const ToonCard: React.FC<ToonCardProps> = ({
  children,
  rotate = 'none',
  padding = 'md',
  interactive = false,
  className = '',
  ...props
}) => {
  const rotateClass = {
    none: '',
    left: '-rotate-1',
    right: 'rotate-1',
  }[rotate];

  const paddingClass = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5 sm:p-6',
    lg: 'p-7 sm:p-8',
  }[padding];

  const interactiveClass = interactive
    ? 'hover:-translate-y-1 hover:shadow-[6px_6px_0px_#111111] transition-all cursor-pointer'
    : '';

  return (
    <div
      className={`bg-white border-2 border-[#111111] rounded-[16px] shadow-[4px_4px_0px_#111111] ${rotateClass} ${paddingClass} ${interactiveClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
