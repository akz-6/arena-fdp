'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toonAudio } from '@/components/fx/utils/sound';
import { useReducedMotion } from '@/lib/client/use-reduced-motion';

export const Header: React.FC = () => {
  const [isMuted, setIsMuted] = useState(true);
  const { reducedMotion, toggleReducedMotion } = useReducedMotion();

  useEffect(() => {
    setIsMuted(toonAudio.getIsMuted());
  }, []);

  const handleToggleSound = () => {
    const next = !isMuted;
    toonAudio.setMuted(next);
    setIsMuted(next);
  };

  return (
    <header className="w-full bg-white border-b-2 border-[#111111] sticky top-0 z-40">
      <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo à esquerda */}
        <Link href="/" className="flex items-center gap-2 group transition-transform active:scale-95">
          <div className="relative w-11 h-11 shrink-0 drop-shadow-[2px_2px_0px_#111111] transition-transform group-hover:rotate-6">
            <Image
              src="/logo.png"
              alt="Arena FDP Logo"
              fill
              sizes="44px"
              className="object-contain"
              priority
            />
          </div>
          <span className="font-black text-xl sm:text-2xl text-[#111111] font-[family-name:var(--font-heading)] tracking-wide">
            ARENA <span className="text-[#0284C7]">FDP</span>
          </span>
        </Link>

        {/* Controles de Acessibilidade e Navegação */}
        <nav className="flex items-center gap-1.5 sm:gap-2">
          {/* Botão de Som */}
          <button
            type="button"
            onClick={handleToggleSound}
            aria-label={isMuted ? 'Ativar sons cartoon' : 'Silenciar sons cartoon'}
            title={isMuted ? 'Ativar sons cartoon' : 'Silenciar sons cartoon'}
            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-[10px] border-2 border-[#111111] bg-white hover:bg-[#F5F5F5] active:translate-y-0.5 transition-all text-base sm:text-lg cursor-pointer"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          {/* Botão de Movimento Reduzido (Acessibilidade) */}
          <button
            type="button"
            onClick={toggleReducedMotion}
            aria-label={
              reducedMotion
                ? 'Movimento reduzido ativado. Clique para ativar animações normais.'
                : 'Animações ativadas. Clique para reduzir animações.'
            }
            title={
              reducedMotion
                ? 'Movimento reduzido (Acessibilidade)'
                : 'Animações normais'
            }
            className={`w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-[10px] border-2 border-[#111111] ${
              reducedMotion ? 'bg-[#FFC233]' : 'bg-white'
            } hover:bg-[#F5F5F5] active:translate-y-0.5 transition-all text-base sm:text-lg cursor-pointer`}
          >
            {reducedMotion ? '🛑' : '🏃'}
          </button>

          <Link
            href="/regras"
            className="hidden xs:inline-block text-xs sm:text-sm font-bold text-[#111111] font-[family-name:var(--font-heading)] px-2.5 sm:px-3 py-1.5 rounded-[10px] border-2 border-transparent hover:border-[#111111] hover:bg-[#F5F5F5] transition-all"
          >
            Regras
          </Link>
          <Link
            href="/perfil"
            className="text-xs sm:text-sm font-bold text-[#111111] font-[family-name:var(--font-heading)] px-2.5 sm:px-3 py-1.5 rounded-[10px] bg-[#FFC233] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#111111] transition-all"
          >
            Perfil
          </Link>
        </nav>
      </div>
    </header>
  );
};
