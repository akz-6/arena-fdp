'use client';

import React from 'react';
import { Player, Proposal } from '@/lib/engine/types';
import { ToonButton } from '@/components/ui';

export interface ProposalBarProps {
  selectedPlayer?: Player | null;
  onAdjustLife?: (delta: 1 | -1) => void;
  onUndoLastRound?: () => void;
  canUndo?: boolean;
  onKickPlayer?: (playerId: string) => void;
  activeProposal?: Proposal | null;
  onVoteProposal?: (proposalId: string, approve: boolean) => void;
  currentUserId?: string;
  players?: Player[];
  isHost?: boolean;
}

export const ProposalBar: React.FC<ProposalBarProps> = ({
  selectedPlayer,
  onAdjustLife,
  onUndoLastRound,
  canUndo = false,
  onKickPlayer,
  activeProposal,
  onVoteProposal,
  currentUserId,
  players = [],
  isHost = false,
}) => {
  // 1. SE HOUVER UMA PROPOSTA ATIVA DE CONSENSO (Task 7.3)
  if (activeProposal && activeProposal.status === 'pending') {
    const target = players.find((p) => p.id === activeProposal.targetId);
    const proposer = players.find((p) => p.id === activeProposal.proposerId);
    const alivePlayers = players.filter((p) => p.status === 'alive' && p.role === 'player');
    const requiredVotes = alivePlayers.length - 1; // Todos os vivos exceto o proponente
    const currentApprovals = activeProposal.approvals.length;
    const hasVoted = currentUserId ? activeProposal.approvals.includes(currentUserId) : false;
    const isProposer = activeProposal.proposerId === currentUserId;

    return (
      <div className="w-full bg-[#FFFBEA] rounded-[16px] border-3 border-black p-4 space-y-3 shadow-[4px_4px_0px_#111111] animate-in fade-in">
        <div className="flex items-center justify-between border-b-2 border-black/20 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚖️</span>
            <span className="font-cartoon text-sm text-black uppercase tracking-wider">
              Consenso de Vida
            </span>
          </div>
          <span className="font-cartoon text-xs bg-yellow-200 border-2 border-black px-2 py-0.5 rounded-full">
            {currentApprovals}/{requiredVotes} Aprovados
          </span>
        </div>

        <div className="text-sm font-bold text-gray-800">
          <strong>{proposer?.name || 'Um guerreiro'}</strong> propõe{' '}
          <span className={`px-1.5 py-0.5 rounded font-black ${activeProposal.delta > 0 ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'}`}>
            {activeProposal.delta > 0 ? '+1 Vida' : '-1 Vida'}
          </span>{' '}
          para <strong>{target?.name || 'um jogador'}</strong>.
        </div>

        <p className="text-xs text-gray-500">
          Requer aprovação unânime de todos os guerreiros vivos para ser aplicado.
        </p>

        {onVoteProposal && !isProposer && (
          <div className="flex gap-2 pt-1">
            <ToonButton
              size="sm"
              variant="primary"
              disabled={hasVoted}
              onClick={() => onVoteProposal(activeProposal.id, true)}
              className="flex-1"
            >
              {hasVoted ? 'APROVADO! ✓' : 'APROVAR ✓'}
            </ToonButton>
            <ToonButton
              size="sm"
              variant="danger"
              disabled={hasVoted}
              onClick={() => onVoteProposal(activeProposal.id, false)}
              className="flex-1"
            >
              REJEITAR ✕
            </ToonButton>
          </div>
        )}

        {isProposer && (
          <p className="text-xs font-bold text-toon-blue text-center">
            Você enviou esta proposta. Aguardando o voto de todos os outros guerreiros...
          </p>
        )}
      </div>
    );
  }

  // 2. CONTROLES PADRÃO / HOST ADJUST (±1 Vida e Desfazer)
  return (
    <div className="w-full bg-[#F5F5F5] rounded-[16px] border-2 border-[#111111] p-3 flex flex-wrap items-center justify-between gap-2 shadow-[2px_2px_0px_#111111]">
      {selectedPlayer && selectedPlayer.status === 'alive' ? (
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="text-xs font-bold text-[#111111] font-[family-name:var(--font-heading)] truncate max-w-[100px]">
            {selectedPlayer.name}:
          </span>
          <div className="flex gap-1.5">
            {onAdjustLife && (
              <>
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
              </>
            )}
            {isHost && onKickPlayer && (
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
          {isHost
            ? 'Toque em um jogador acima para ajustar vida (±1 direto).'
            : 'Toque em um jogador acima para propor ajuste de vida (consenso).'}
        </span>
      )}

      {/* Botão Desfazer Última Rodada */}
      {canUndo && onUndoLastRound && (
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
