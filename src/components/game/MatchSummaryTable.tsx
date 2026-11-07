'use client';

import React from 'react';
import { Player } from '@/lib/engine/types';
import { ToonCard } from '../ui/ToonCard';
import { Avatar } from '../toon/Avatar';

export interface MatchSummaryTableProps {
  players: readonly Player[];
  winners: string[] | null;
  roundNumber: number;
}

export const MatchSummaryTable: React.FC<MatchSummaryTableProps> = ({
  players,
  winners = [],
  roundNumber,
}) => {
  const winnerSet = new Set(winners || []);

  // Ordena: vencedores primeiro, depois por vida decrescente
  const sortedPlayers = [...players]
    .filter((p) => p.role === 'player')
    .sort((a, b) => {
      const aWon = winnerSet.has(a.id) ? 1 : 0;
      const bWon = winnerSet.has(b.id) ? 1 : 0;
      if (bWon !== aWon) return bWon - aWon;
      return (b.life ?? 0) - (a.life ?? 0);
    });

  return (
    <ToonCard padding="md" className="w-full bg-white border-3 border-[#111111] space-y-3">
      <div className="flex items-center justify-between border-b-2 border-gray-100 pb-2">
        <h4 className="font-cartoon text-base text-[#111111]">
          Resumo Final da Partida 📜
        </h4>
        <span className="text-xs font-bold text-gray-500">
          {roundNumber} rodadas
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 font-cartoon">
              <th className="py-1 px-2">Pos</th>
              <th className="py-1 px-2">Guerreiro</th>
              <th className="py-1 px-2 text-center">Vida Final</th>
              <th className="py-1 px-2 text-right">Resultado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedPlayers.map((p, idx) => {
              const isWinner = winnerSet.has(p.id);
              const lifeDisplay = p.life !== undefined ? `${p.life} ❤️` : '0 ❤️';

              return (
                <tr key={p.id} className={isWinner ? 'bg-yellow-50/60 font-bold' : ''}>
                  <td className="py-2 px-2 font-cartoon text-sm text-[#111111]">
                    {idx === 0 && isWinner ? '🥇' : idx === 1 && isWinner ? '🥈' : `${idx + 1}º`}
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={p.name} color={p.color} size="sm" />
                      <span className="font-bold text-[#111111] truncate max-w-[120px]">
                        {p.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-center font-black text-[#111111]">
                    {lifeDisplay}
                  </td>
                  <td className="py-2 px-2 text-right font-black">
                    {isWinner ? (
                      <span className="text-green-600">🏆 Venceu!</span>
                    ) : (
                      <span className="text-red-500">💀 Eliminado</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ToonCard>
  );
};
