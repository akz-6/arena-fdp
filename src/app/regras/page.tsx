'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CARD_TIERS } from '@/lib/engine/cards';
import { ToonCard, ToonButton } from '@/components/ui';

export default function RulesPage() {
  const [selectedTier, setSelectedTier] = useState<number | null>(13); // Default Zap

  // Inverte para exibir do mais forte (Zap = 13) para o mais fraco (4s comuns = 0)
  const reversedTiers = [...CARD_TIERS].reverse();

  return (
    <div className="flex-1 flex flex-col items-center justify-start py-4 max-w-md mx-auto w-full gap-5">
      <div className="w-full text-center">
        <h1 className="text-3xl font-black font-[family-name:var(--font-heading)] text-[#111111]">
          Regras do Jogo
        </h1>
        <p className="text-xs text-[#666666] font-semibold mt-1">
          Hierarquia de cartas, ciclo de rodadas e vidas do Arena FDP
        </p>
      </div>

      {/* 1. Hierarquia de Cartas Interativa */}
      <ToonCard padding="md" className="w-full flex flex-col gap-3">
        <div className="flex items-center justify-between border-b-2 border-[#111111] pb-2">
          <h2 className="text-lg font-black font-[family-name:var(--font-heading)] text-[#111111]">
            🃏 Força das Cartas
          </h2>
          <span className="text-[11px] font-bold text-[#FF3038]">Do Zap aos Quatros</span>
        </div>

        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
          {reversedTiers.map((tier) => {
            const isSelected = selectedTier === tier.position;
            const isZap = tier.position === 13;
            const isManilha = tier.position >= 10;

            return (
              <div
                key={tier.position}
                onClick={() => setSelectedTier(tier.position)}
                className={`p-2.5 rounded-[12px] border-2 border-[#111111] cursor-pointer transition-all flex flex-col gap-1 ${
                  isSelected
                    ? isZap
                      ? 'bg-[#FFC233] shadow-[3px_3px_0px_#111111] scale-[1.02]'
                      : 'bg-[#F5F5F5] shadow-[3px_3px_0px_#111111] scale-[1.02]'
                    : 'bg-white hover:bg-[#F9F9F9]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#111111] text-white text-xs font-black flex items-center justify-center">
                      {tier.position + 1}
                    </span>
                    <span className="font-bold text-sm text-[#111111] font-[family-name:var(--font-heading)]">
                      {tier.name}
                    </span>
                  </div>

                  {tier.nickname && (
                    <span className="bg-[#FF3038] text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-[#111111]">
                      🔥 {tier.nickname}
                    </span>
                  )}
                  {!tier.nickname && isManilha && (
                    <span className="bg-[#35B8F4] text-[#111111] text-[10px] font-black px-2 py-0.5 rounded-full border border-[#111111]">
                      Manilha
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-[#666666]">
                  <span className="font-semibold">{tier.cards.join(' • ')}</span>
                  {isSelected && (
                    <span className="text-[11px] text-[#111111] font-bold">
                      {tier.description}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ToonCard>

      {/* 2. Como Funciona a Partida */}
      <ToonCard padding="md" className="w-full flex flex-col gap-3">
        <h2 className="text-lg font-black font-[family-name:var(--font-heading)] text-[#111111]">
          📖 Dinâmica da Partida
        </h2>

        <div className="flex flex-col gap-2.5 text-xs text-[#333333] font-medium leading-relaxed">
          <p>
            • <strong>Jogo Físico:</strong> O baralho de cartas é real e físico. O aplicativo atua como o telão de controle de vidas, dealer e rodadas.
          </p>
          <p>
            • <strong>Cartas por Rodada:</strong> A primeira rodada começa com 1 carta. Depois 2, 3, 4... até o teto calculado. Ao atingir o teto, desce até 1 e volta a subir.
          </p>
          <p>
            • <strong>Eliminação:</strong> Quem zera as vidas é eliminado. O último sobrevivente em pé é o <strong>Campeão da Arena</strong>!
          </p>
          <p>
            • <strong>Empate:</strong> Se todos os últimos sobreviventes morrerem na mesma rodada, a vitória é dividida entre eles com direito a revanche.
          </p>
        </div>
      </ToonCard>

      <Link href="/" className="w-full">
        <ToonButton variant="secondary" size="md" fullWidth>
          ⬅ Voltar para o Início
        </ToonButton>
      </Link>
    </div>
  );
}
