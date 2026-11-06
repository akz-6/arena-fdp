'use client';

import React from 'react';
import { Player } from '@/lib/engine/types';
import { Avatar } from '@/components/toon/Avatar';

export interface PlayerGridProps {
  players: readonly Player[];
  hostId: string;
  dealerId: string | null;
  lifeVisibility: 'visible' | 'hidden';
  selectedPlayerId?: string | null;
  onSelectPlayer?: (playerId: string) => void;
  isTelao?: boolean;
}

export const PlayerGrid: React.FC<PlayerGridProps> = ({
  players,
  hostId,
  dealerId,
  lifeVisibility,
  selectedPlayerId,
  onSelectPlayer,
  isTelao = false,
}) => {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 w-full select-none ${isTelao ? 'gap-4 sm:grid-cols-4' : ''}`}>
      {players.map((player) => {
        const isSelected = selectedPlayerId === player.id;
        const isHost = player.id === hostId;
        const isDealer = player.id === dealerId;
        const isAlive = player.status === 'alive';
        const isDead = player.status === 'dead';

        // Em modo oculto, NUNCA passa número de vida
        const displayLife = lifeVisibility === 'visible' && player.life !== undefined ? player.life : null;

        return (
          <div
            key={player.id}
            onClick={() => onSelectPlayer && onSelectPlayer(player.id)}
            className={`relative flex flex-col items-center justify-between p-3 rounded-[16px] border-2 border-[#111111] transition-all cursor-pointer ${
              isSelected
                ? 'bg-[#FFC233]/25 ring-4 ring-[#111111] scale-[1.03] shadow-[4px_4px_0px_#111111]'
                : isDead
                ? 'bg-[#F0F0F0] opacity-60 shadow-[2px_2px_0px_#111111]'
                : 'bg-white hover:bg-[#F9F9F9] shadow-[3px_3px_0px_#111111]'
            }`}
          >
            {/* Indicador de Dealer */}
            {isDealer && isAlive && (
              <span className="absolute top-1.5 left-1.5 text-[10px] font-black bg-[#35B8F4] text-[#111111] px-1.5 py-0.2 rounded-full border border-[#111111]">
                🃏 DEALER
              </span>
            )}

            {/* Avatar do Jogador */}
            <div className="my-1">
              <Avatar
                name={player.name}
                color={player.color}
                status={
                  player.status === 'alive'
                    ? 'idle'
                    : player.status === 'away'
                    ? 'away'
                    : 'dead'
                }
                size={isTelao ? 'lg' : 'md'}
                isHost={isHost}
                lives={displayLife}
              />
            </div>

            {/* Status do Jogador */}
            <div className="flex items-center gap-1 mt-1">
              {isDead ? (
                <span className="text-[11px] font-black text-[#FF3038] uppercase">💀 ELIMINADO</span>
              ) : player.status === 'away' ? (
                <span className="text-[11px] font-bold text-[#666666]">zZ AUSENTE</span>
              ) : player.role === 'spectator' ? (
                <span className="text-[11px] font-bold text-[#666666]">👀 ESPECTADOR</span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
