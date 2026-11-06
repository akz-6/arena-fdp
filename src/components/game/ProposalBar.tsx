'use client';

import React from 'react';
import { Player } from '@/lib/engine/types';
import { ToonButton } from '@/components/ui';

export interface ProposalBarProps {
  selectedPlayer: Player | undefined;
  onAdjustLife: (delta: 1 | -1) => void;
  onUndoLastRound: () => void;
  canUndo: boolean;
  onKickPlayer?: (playerId: string) => void;
}

export const ProposalBar: React.FC<ProposalBarProps> = ({
  selectedPlayer,
  onAdjustLife,
  onUndoLastRound,
  canUndo,
  onKickPlayer,
}) => {
  return (
    <div className="w-full bg-[#F5F5F5] rounded-[16px] border-2 border-[#111111] p-3 flex flex-wrap items-center justify-between gap-2 shadow-[2px_2px_0px_#111111]">
      {selectedPlayer && selectedPlayer.status === 'alive' ? (
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="text-xs font-bold text-[#111111] font-[family-name:var(--font-heading)] truncate max-w-[100px]">
            {selectedPlayer.name}:
          </span>
          <div className="flex gap-1.5">
            <ToonButton
              size="sm"
              variant="danger"
              onClick={() => onAdjustLife(-1)}
              aria-label="Tirar 1 de vida"
            >
              -1 Vida
            </ToonButton>
            <ToonButton
              size="sm"
              variant="yellow"
              onClick={() => onAdjustLife(1)}
              aria-label="Dar 1 de vida"
            >
              +1 Vida
            </ToonButton>
            {onKickPlayer && (
              <button
                type="button"
                onClick={() => onKickPlayer(selectedPlayer.id)}
                className="text-[11px] font-bold text-[#FF3038] hover:underline px-2 cursor-pointer"
              >
                Expulsar
              </button>
            )}
          </div>
        </div>
      ) : (
        <span className="text-xs text-[#666666] font-medium flex-1">
          Toque em um jogador acima para ajustar vida (±1).
        </span>
      )}

      {/* Botão Desfazer Última Rodada */}
      {canUndo && (
        <button
          type="button"
          onClick={onUndoLastRound}
          className="text-xs font-black text-[#111111] bg-white hover:bg-[#FFC233] px-3 py-1.5 rounded-[10px] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] transition-all cursor-pointer"
        >
          ↩ Desfazer Rodada
        </button>
      )}
    </div>
  );
};
