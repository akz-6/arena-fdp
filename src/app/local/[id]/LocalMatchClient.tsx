'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useLocalGamesStore } from '@/lib/client/local-game-store';
import { reduce } from '@/lib/engine/reducer';
import { createRng } from '@/lib/engine/rng';
import { GameAction } from '@/lib/engine/types';
import { RoundHeader, PlayerGrid, ReportPanel, ProposalBar } from '@/components/game';
import { FxDirector, VictoryFx } from '@/components/fx';
import { ToonButton, ToonCard, useToast } from '@/components/ui';

export default function LocalMatchClient({ matchId }: { matchId: string }) {
  const { matches, saveMatch } = useLocalGamesStore();
  const savedMatch = matches[matchId];
  const { showToast } = useToast();

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [pendingDamage, setPendingDamage] = useState<Record<string, number>>({});
  const [isTelao, setIsTelao] = useState(false);

  // Wake Lock e Fullscreen para o modo telão
  const handleToggleTelao = useCallback(async () => {
    if (!isTelao) {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
        if ('wakeLock' in navigator) {
          await (navigator as unknown as { wakeLock: { request: (type: string) => Promise<unknown> } }).wakeLock.request('screen');
        }
      } catch {
        // Fallback silencioso
      }
      setIsTelao(true);
      showToast('Modo Telão ativado!', 'info');
    } else {
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } catch {
        // Fallback silencioso
      }
      setIsTelao(false);
    }
  }, [isTelao, showToast]);

  if (!savedMatch) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-4">
        <span className="text-4xl">🔍</span>
        <h2 className="text-2xl font-black font-[family-name:var(--font-heading)] text-[#111111]">
          Partida Não Encontrada
        </h2>
        <p className="text-sm text-[#666666]">
          Essa partida pode ter sido excluída ou o link está incorreto.
        </p>
        <Link href="/local">
          <ToonButton variant="primary">Voltar para Partidas</ToonButton>
        </Link>
      </div>
    );
  }

  const state = savedMatch.state;

  const dispatch = (action: GameAction) => {
    try {
      const ctx = { now: Date.now(), rng: createRng(Date.now()) };
      const { state: nextState } = reduce(state, action, ctx);
      saveMatch(matchId, nextState);

      if (action.type === 'END_ROUND') {
        setPendingDamage({});
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar ação';
      showToast(msg, 'error');
    }
  };

  const selectedPlayer = state.players.find((p) => p.id === selectedPlayerId);
  const dealer = state.players.find((p) => p.id === state.dealerId);

  // 1. Fase LOBBY: botão para dar START
  if (state.phase === 'lobby') {
    return (
      <div className="flex-1 flex flex-col items-center justify-between py-6 max-w-md mx-auto w-full gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-black font-[family-name:var(--font-heading)] text-[#111111]">
            {state.config.roomName}
          </h1>
          <p className="text-xs text-[#666666] font-bold mt-1">
            Modo Local • {state.players.length} Jogadores
          </p>
        </div>

        <PlayerGrid
          players={state.players}
          hostId={state.hostId}
          dealerId={state.dealerId}
          lifeVisibility="hidden"
          selectedPlayerId={selectedPlayerId}
          onSelectPlayer={setSelectedPlayerId}
        />

        <div className="w-full flex flex-col gap-3">
          <ToonButton
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => dispatch({ type: 'START', actorId: state.hostId })}
            className="text-xl shadow-[5px_5px_0px_#111111]"
          >
            ▶ COMEÇAR PARTIDA
          </ToonButton>
          <Link href="/local" className="w-full">
            <ToonButton variant="secondary" fullWidth>
              ⬅ Sair para Lista
            </ToonButton>
          </Link>
        </div>
      </div>
    );
  }

  // 2. Fase FINISHED: tela de vitória/empate
  if (state.phase === 'finished') {
    const isTie = (state.winners?.length ?? 0) > 1 || state.winners?.length === 0;
    const singleWinner = state.players.find((p) => p.id === state.winners?.[0]);
    const tiedPlayers = state.players.filter((p) => state.winners?.includes(p.id));

    return (
      <div className="flex-1 flex flex-col items-center justify-between py-6 max-w-md mx-auto w-full gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-black font-[family-name:var(--font-heading)] text-[#111111]">
            Fim de Jogo!
          </h1>
          <p className="text-xs text-[#666666] font-bold mt-1">
            {state.roundNumber} rodadas disputadas
          </p>
        </div>

        <VictoryFx
          isTie={isTie}
          winnerName={singleWinner?.name}
          winnerColor={singleWinner?.color}
          tiedWinners={tiedPlayers.map((p) => ({ name: p.name, color: p.color }))}
          isTelao={isTelao}
        />

        {/* Resumo Final da Partida */}
        <ToonCard padding="md" className="w-full">
          <h4 className="text-sm font-black font-[family-name:var(--font-heading)] text-[#111111] mb-2">
            Sobreviventes e Classificação
          </h4>
          <div className="flex flex-col gap-1.5 text-xs">
            {state.players.map((p, i) => (
              <div key={p.id} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-none">
                <span className="font-bold text-[#111111]">
                  {i + 1}. {p.name}
                </span>
                <span className={p.status === 'alive' ? 'text-[#2ECC71] font-black' : 'text-[#FF3038] font-bold'}>
                  {p.status === 'alive' ? '🏆 Venceu' : '💀 Eliminado'}
                </span>
              </div>
            ))}
          </div>
        </ToonCard>

        <div className="w-full flex gap-3">
          <ToonButton
            variant="yellow"
            size="lg"
            className="flex-1 text-lg"
            onClick={() => dispatch({ type: 'REMATCH', actorId: state.hostId })}
          >
            🔄 Revanche
          </ToonButton>
          <Link href="/local" className="flex-1">
            <ToonButton variant="secondary" size="lg" fullWidth className="text-lg">
              Sair
            </ToonButton>
          </Link>
        </div>
      </div>
    );
  }

  // 3. Fases ROUND, REPORTING e REVEAL
  return (
    <div className={`flex-1 flex flex-col items-center justify-between py-2 max-w-md mx-auto w-full gap-4 ${isTelao ? 'max-w-2xl' : ''}`}>
      {/* Barra de Ferramentas Superior */}
      <div className="w-full flex items-center justify-between px-1">
        <Link href="/local" className="text-xs font-bold text-[#666666] hover:text-[#111111]">
          ⬅ Partidas
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleTelao}
            className="text-xs font-black bg-white hover:bg-[#FFC233] px-2.5 py-1 rounded-[8px] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] cursor-pointer"
          >
            {isTelao ? 'Sair do Telão' : '📺 Telão'}
          </button>
        </div>
      </div>

      {/* Cabeçalho da Rodada */}
      <RoundHeader
        roundNumber={state.roundNumber}
        cardsThisRound={state.cardsThisRound}
        dealerName={dealer?.name}
        isTelao={isTelao}
      />

      {/* Conteúdo Dinâmico por Fase */}
      {state.phase === 'round' && (
        <div className="w-full flex flex-col gap-4">
          <PlayerGrid
            players={state.players}
            hostId={state.hostId}
            dealerId={state.dealerId}
            lifeVisibility={state.config.lifeVisibility}
            selectedPlayerId={selectedPlayerId}
            onSelectPlayer={setSelectedPlayerId}
            isTelao={isTelao}
          />

          <ProposalBar
            selectedPlayer={selectedPlayer}
            canUndo={Boolean(state.prevSnapshot)}
            onAdjustLife={(delta) => {
              if (selectedPlayerId) {
                dispatch({
                  type: 'HOST_ADJUST',
                  actorId: state.hostId,
                  targetId: selectedPlayerId,
                  delta,
                });
              }
            }}
            onUndoLastRound={() => dispatch({ type: 'UNDO_LAST_ROUND', actorId: state.hostId })}
            onKickPlayer={(id) => dispatch({ type: 'KICK', actorId: state.hostId, targetId: id })}
          />

          <ToonButton
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => dispatch({ type: 'END_ROUND', actorId: state.hostId })}
            className="text-xl shadow-[5px_5px_0px_#111111] mt-2"
          >
            ⏹ FIM DA RODADA (REPORTAR)
          </ToonButton>
        </div>
      )}

      {state.phase === 'reporting' && (
        <div className="w-full">
          <ReportPanel
            players={state.players}
            pendingDamage={pendingDamage}
            onSetDamage={(playerId, damage) => {
              setPendingDamage((prev) => ({ ...prev, [playerId]: damage }));
            }}
            onSubmitReport={() => {
              // Aplica o dano de cada jogador vivo
              const alive = state.players.filter((p) => p.status === 'alive' && p.role === 'player');
              for (const p of alive) {
                const dmg = pendingDamage[p.id] ?? 0;
                dispatch({
                  type: 'SET_DAMAGE',
                  actorId: state.hostId,
                  targetId: p.id,
                  damage: dmg,
                });
                dispatch({
                  type: 'CONFIRM',
                  actorId: p.id,
                });
              }
            }}
          />
        </div>
      )}

      {state.phase === 'reveal' && (
        <div className="w-full flex flex-col items-center gap-4">
          <FxDirector
            reveal={state.lastReveal}
            players={state.players}
            showHitCount={state.config.showHitCount}
            isTelao={isTelao}
            onFinish={() => {}}
          />

          {/* Botão de Avançar Rodada */}
          <ToonButton
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => {
              dispatch({ type: 'NEXT_ROUND', actorId: state.hostId });
            }}
            className="text-xl shadow-[5px_5px_0px_#111111] mt-2"
          >
            ⏩ PRÓXIMA RODADA
          </ToonButton>
        </div>
      )}
    </div>
  );
}
