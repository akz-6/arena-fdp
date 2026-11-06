'use client';

import React from 'react';
import Link from 'next/link';
import { ToonCard, ToonButton } from '@/components/ui';

export default function CreateRoomPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 py-6">
      <ToonCard padding="lg" className="w-full max-w-sm flex flex-col items-center gap-4">
        <div className="w-20 h-20 bg-[#35B8F4] rounded-full border-2 border-[#111111] shadow-[3px_3px_0px_#111111] flex items-center justify-center text-4xl">
          🎮
        </div>

        <h1 className="text-2xl font-black font-[family-name:var(--font-heading)] text-[#111111]">
          Criar Sala
        </h1>

        <p className="text-sm text-[#666666]">
          Configure as regras da partida: modo Singleplayer (local) ou Online, vidas fixas ou aleatórias, visíveis ou ocultas.
        </p>

        <div className="bg-[#F5F5F5] p-3 rounded-[12px] border-2 border-dashed border-[#111111] w-full text-xs font-bold text-[#111111]">
          ✨ Configuração completa na Fase 4 (Local) e Fase 6 (Online)
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
