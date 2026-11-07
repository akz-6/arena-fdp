'use client';

import React, { useState } from 'react';
import { GameState, Player } from '@/lib/engine/types';
import { ToonCard } from '../ui/ToonCard';
import { ToonButton } from '../ui/ToonButton';
import { Stepper } from '../ui/Stepper';
import { Avatar } from '../toon/Avatar';

export interface OnlineReportPanelProps {
  room: GameState;
  me: Player;
  isHost: boolean;
  onConfirmDamage: (damage: number) => Promise<void>;
  onForceClose: () => Promise<void>;
}

export const OnlineReportPanel: React.FC<OnlineReportPanelProps> = ({
  room,
  me,
  isHost,
  onConfirmDamage,
  onForceClose,
}) => {
  const isPlayingAlive = me.role === 'player' && me.status === 'alive';
  const hasConfirmed = room.confirmed.includes(me.id);

  // Dano inicial: valor salvo se houver, ou 0
  const initialDamage = room.pendingDamage?.[me.id] ?? 0;
  const [myDamage, setMyDamage] = useState<number>(initialDamage);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showForceModal, setShowForceModal] = useState<boolean>(false);

  // Teto do stepper:
  // Se visível: limitado à vida atual do jogador
  // Se oculta: teto fixo e razoável (15) para evitar qualquer canal lateral de informação
  const maxDamage =
    room.config.lifeVisibility === 'visible' && me.life !== undefined
      ? me.life
      : 15;

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onConfirmDamage(myDamage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForceCloseSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onForceClose();
      setShowForceModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const alivePlayers = room.players.filter(
    (p) => p.status === 'alive' && p.role === 'player'
  );

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* 1. SEÇÃO DE REPORTE DO JOGADOR (Se estiver vivo na partida) */}
      {isPlayingAlive ? (
        <ToonCard className="p-5 bg-white border-3 border-[#111111] space-y-4 text-center">
          <div className="space-y-1">
            <span className="text-xs font-black uppercase tracking-wider text-[#666666]">
              Apuração de Danos • Rodada {room.roundNumber}
            </span>
            <h3 className="font-cartoon text-2xl text-[#111111]">
              Quantos golpes você tomou?
            </h3>
            <p className="text-xs text-[#666666] font-medium">
              Ajuste o dano sofrido com as cartas desta rodada e confirme.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center py-2">
            <Stepper
              value={myDamage}
              min={0}
              max={maxDamage}
              onChange={setMyDamage}
              disabled={submitting}
            />
          </div>

          <div className="pt-2">
            <ToonButton
              variant={hasConfirmed ? 'secondary' : 'primary'}
              size="lg"
              onClick={handleConfirm}
              disabled={submitting}
              className="w-full text-lg py-3"
            >
              {submitting
                ? 'ENVIANDO...'
                : hasConfirmed
                ? '✅ RECONFIRMAR DANO'
                : 'CONFIRMAR MEU DANO 🥊'}
            </ToonButton>
          </div>
        </ToonCard>
      ) : (
        /* Se for espectador ou eliminado */
        <ToonCard className="p-4 bg-gray-50 border-2 border-[#111111] text-center space-y-1">
          <p className="text-sm font-bold text-[#111111]">
            👀 Você está assistindo a apuração de danos como{' '}
            {me.role === 'spectator' ? 'Espectador' : 'Eliminado'}.
          </p>
          <p className="text-xs text-gray-500">
            Aguardando os jogadores ativos confirmarem seus danos.
          </p>
        </ToonCard>
      )}

      {/* 2. LISTA DE STATUS DE CONFIRMAÇÃO DOS JOGADORES VIVOS */}
      <ToonCard className="p-4 bg-white border-2 border-[#111111] space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-cartoon text-sm uppercase tracking-wide text-[#111111]">
            Status da Sala ({room.confirmed.length}/{alivePlayers.length})
          </h4>
          <span className="text-[11px] font-bold text-[#666666]">
            Danos serão revelados juntos
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {alivePlayers.map((player) => {
            const confirmed = room.confirmed.includes(player.id);
            const isMe = player.id === me.id;

            return (
              <div
                key={player.id}
                className="py-2 flex items-center justify-between gap-3 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar name={player.name} color={player.color} size="sm" />
                  <span className="font-bold text-[#111111] truncate">
                    {player.name} {isMe && '(Você)'}
                  </span>
                </div>

                <div>
                  {confirmed ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-green-100 text-green-800 border border-green-300">
                      ✅ Confirmou
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300 animate-pulse">
                      ⏳ Pensando...
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ToonCard>

      {/* 3. CONTROLE DE HOST: FORÇAR FECHAMENTO (FORCE_CLOSE) */}
      {isHost && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowForceModal(true)}
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-[#FF3038] text-[#FF3038] hover:bg-red-50 text-xs font-black tracking-wide uppercase transition-all cursor-pointer text-center"
          >
            ⚠️ Forçar Fechamento da Rodada (Host)
          </button>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DO FORÇAR FECHAMENTO */}
      {showForceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <ToonCard className="p-6 max-w-sm w-full bg-white space-y-4 text-center">
            <span className="text-4xl">⚠️</span>
            <h4 className="font-cartoon text-xl text-black">
              Forçar Fechamento?
            </h4>
            <p className="text-xs text-gray-600 font-medium">
              Todos os jogadores que ainda não confirmaram receberão <strong>0 de dano</strong> nesta rodada.
            </p>
            <div className="flex gap-2 pt-2">
              <ToonButton
                variant="secondary"
                onClick={() => setShowForceModal(false)}
                disabled={submitting}
                className="flex-1"
              >
                Cancelar
              </ToonButton>
              <ToonButton
                variant="danger"
                onClick={handleForceCloseSubmit}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? 'Fechando...' : 'Sim, Forçar!'}
              </ToonButton>
            </div>
          </ToonCard>
        </div>
      )}
    </div>
  );
};
