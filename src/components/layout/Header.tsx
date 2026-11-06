'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export const Header: React.FC = () => {
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
              className="object-contain"
              priority
            />
          </div>
          <span className="font-black text-xl sm:text-2xl text-[#111111] font-[family-name:var(--font-heading)] tracking-wide">
            ARENA <span className="text-[#35B8F4]">FDP</span>
          </span>
        </Link>

        {/* Navegação minimalista */}
        <nav className="flex items-center gap-2">
          <Link
            href="/regras"
            className="text-xs sm:text-sm font-bold text-[#111111] font-[family-name:var(--font-heading)] px-3 py-1.5 rounded-[10px] border-2 border-transparent hover:border-[#111111] hover:bg-[#F5F5F5] transition-all"
          >
            Como Jogar
          </Link>
          <Link
            href="/perfil"
            className="text-xs sm:text-sm font-bold text-[#111111] font-[family-name:var(--font-heading)] px-3 py-1.5 rounded-[10px] bg-[#FFC233] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#111111] transition-all"
          >
            Perfil
          </Link>
        </nav>
      </div>
    </header>
  );
};
