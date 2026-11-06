'use client';

import React from 'react';
import Link from 'next/link';
import { ToonCard, ToonButton } from '@/components/ui';

export default function ProfilePage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 py-6">
      <ToonCard padding="lg" className="w-full max-w-sm flex flex-col items-center gap-4">
        <div className="w-20 h-20 bg-[#FFC233] rounded-full border-2 border-[#111111] shadow-[3px_3px_0px_#111111] flex items-center justify-center text-4xl">
          👤
        </div>

        <h1 className="text-2xl font-black font-[family-name:var(--font-heading)] text-[#111111]">
          Perfil do Jogador
        </h1>

        <p className="text-sm text-[#666666]">
          Aqui você poderá definir seu nome único no Arena FDP, sua cor de personagem e recuperar seu perfil.
        </p>

        <div className="bg-[#F5F5F5] p-3 rounded-[12px] border-2 border-dashed border-[#111111] w-full text-xs font-bold text-[#111111]">
          ✨ Chegando nas Fases 4 e 6 (Local e Global)
        </div>

        <Link href="/" className="w-full mt-2">
          <ToonButton variant="secondary" size="md" fullWidth>
            ⬅ Voltar para o Início
          </ToonButton>
        </Link>
      </ToonCard>
    </div>
  );
}
