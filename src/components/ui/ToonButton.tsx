'use client';

import React, { forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'yellow' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ToonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const ToonButton = forwardRef<HTMLButtonElement, ToonButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    // Estilos base
    const baseStyles =
      'inline-flex items-center justify-center font-bold font-[family-name:var(--font-heading)] select-none rounded-[14px] cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-[#35B8F4] focus-visible:ring-offset-2 transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none';

    // Variantes
    const variantStyles: Record<ButtonVariant, string> = {
      // Primary: Fundo preto, texto branco, borda preta, sombra sólida preta, destaque amarelo no hover
      primary:
        'bg-[#111111] text-white border-2 border-[#111111] shadow-[4px_4px_0px_#111111] hover:bg-[#222222] hover:text-[#FFC233] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#111111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#111111]',

      // Secondary: Fundo branco, texto preto, borda 2px preta, sombra sólida preta
      secondary:
        'bg-[#FFFFFF] text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] hover:bg-[#F9F9F9] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#111111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#111111]',

      // Danger: Fundo vermelho, texto branco, borda 2px preta
      danger:
        'bg-[#FF3038] text-white border-2 border-[#111111] shadow-[4px_4px_0px_#111111] hover:bg-[#E81E26] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#111111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#111111]',

      // Yellow: Destaque amarelo vibrante
      yellow:
        'bg-[#FFC233] text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] hover:bg-[#EBB01F] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#111111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#111111]',

      // Ghost: Transparente com contorno sutil ou branco
      ghost:
        'bg-transparent text-[#111111] border-2 border-transparent hover:border-[#111111] hover:bg-[#F5F5F5] active:translate-x-[1px] active:translate-y-[1px]',
    };

    // Tamanhos
    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'text-sm py-1.5 px-3 min-h-[40px]',
      md: 'text-base py-3 px-5 min-h-[48px]',
      lg: 'text-lg py-3.5 px-7 min-h-[56px] text-xl',
    };

    const widthStyle = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <span>Carregando...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

ToonButton.displayName = 'ToonButton';
