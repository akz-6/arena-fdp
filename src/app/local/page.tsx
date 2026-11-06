'use client';

import React from 'react';
import Link from 'next/link';
import { useLocalGamesStore } from '@/lib/client/local-game-store';
import { ToonButton, ToonCard, useToast } from '@/components/ui';

export default function LocalMatchesListPage() {
  const { matches, deleteMatch } = useLocalGamesStore();
  const { showToast } = useToast();

  const matchList = Object.values(matches).sort((a, b) => b.updatedAt - a.updatedAt);

  const handleDelete = (id: string, name: string) => {
    deleteMatch(id);
    showToast(`Partida "${name}" excluída!`, 'info');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start py-4 max-w-md mx-auto w-full gap-5">
      <div className="w-full text-center">
        <h1 className="text-3xl font-black font-[family-name:var(--font-heading)] text-[#111111]">
          Partidas Locais
        </h1>
        <p className="text-xs text-[#666666] font-semibold mt-1">
          Partidas salvas neste aparelho (Singleplayer / Offline)
        </p>
      </div>

      <Link href="/criar" className="w-full">
        <ToonButton variant="primary" size="lg" fullWidth className="text-lg">
          + NOVA PARTIDA
        </ToonButton>
      </Link>

      {/* Lista de Partidas Salvas */}
      <div className="w-full flex flex-col gap-3">
        {matchList.length === 0 ? (
          <div className="p-8 text-center bg-[#F5F5F5] rounded-[18px] border-2 border-dashed border-[#111111]">
            <span className="text-3xl">🃏</span>
            <p className="text-sm font-bold text-[#111111] mt-2">
              Nenhuma partida salva encontrada.
            </p>
            <p className="text-xs text-[#666666] mt-0.5">
              Toque no botão acima para criar uma nova sala!
            </p>
          </div>
        ) : (
          matchList.map((m) => {
            const dateStr = new Date(m.updatedAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            });

            const aliveCount = m.state.players.filter(
              (p) => p.status === 'alive' && p.role === 'player'
            ).length;

            return (
              <ToonCard key={m.id} padding="md" className="flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-black font-[family-name:var(--font-heading)] text-[#111111]">
                      {m.roomName}
                    </h3>
                    <p className="text-xs text-[#666666] font-medium">
                      {m.state.phase === 'finished'
                        ? '🏆 Partida Encerrada'
                        : `Rodada ${m.state.roundNumber} • ${aliveCount} vivos`}
                    </p>
                  </div>
                  <span className="text-[10px] text-[#888888] font-bold">{dateStr}</span>
                </div>

                <div className="flex gap-2 mt-2">
                  <Link href={`/local/${m.id}`} className="flex-1">
                    <ToonButton variant="yellow" size="sm" fullWidth>
                      Continuar ▶
                    </ToonButton>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(m.id, m.roomName)}
                    className="px-3 py-1 text-xs font-bold text-[#FF3038] hover:bg-[#FF3038]/10 rounded-[8px] cursor-pointer"
                  >
                    Excluir
                  </button>
                </div>
              </ToonCard>
            );
          })
        )}
      </div>

      <Link href="/" className="w-full mt-2">
        <ToonButton variant="secondary" size="md" fullWidth>
          ⬅ Voltar para o Início
        </ToonButton>
      </Link>
    </div>
  );
}
