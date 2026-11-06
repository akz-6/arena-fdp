'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRoom } from '@/lib/client/realtime';
import { LobbyView } from '@/components/game/LobbyView';
import { JoinRoomScreen } from '@/components/game/JoinRoomScreen';
import { RoundHeader } from '@/components/game/RoundHeader';
import { PlayerGrid } from '@/components/game/PlayerGrid';
import { ReportPanel } from '@/components/game/ReportPanel';
import { ProposalBar } from '@/components/game/ProposalBar';
import { FxDirector } from '@/components/fx/FxDirector';
import { VictoryFx } from '@/components/fx/VictoryFx';
import { ToonCard } from '@/components/ui/ToonCard';
import { ToonButton } from '@/components/ui/ToonButton';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

interface RoomClientProps {
  code: string;
}

export default function RoomClient({ code }: RoomClientProps) {
  const {
    room,
    minimalInfo,
    me,
    isHost,
    isSpectator,
    isJoined,
    loading,
    error,
    connectionStatus,
    sendAction,
    leaveRoom,
    reload,
  } = useRoom(code);

  const { showToast } = useToast();
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [pendingDamage, setPendingDamage] = useState<Record<string, number>>({});

  // Wake Lock para evitar que a tela apague
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch {
        // Ignora se não for suportado
      }
    };
    requestWakeLock();
    return () => {
      if (wakeLock) wakeLock.release().catch(() => {});
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Carregamento inicial
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 space-y-4">
        <div className="w-16 h-16 border-4 border-black border-t-[#FFC233] rounded-full animate-spin shadow-[4px_4px_0px_#111111]" />
        <p className="font-black font-[family-name:var(--font-heading)] text-2xl text-black">
          Entrando na Arena {code}...
        </p>
      </div>
    );
  }

  // Erro (ex: sala inexistente)
  if (error && !minimalInfo && !room) {
    return (
      <div className="max-w-md mx-auto my-12 p-4">
        <ToonCard className="p-6 text-center space-y-4">
          <div className="text-5xl">💥</div>
          <h2 className="font-black font-[family-name:var(--font-heading)] text-2xl text-black">
            {error}
          </h2>
          <p className="text-sm text-gray-600">
            Verifique se o código <strong>{code}</strong> foi digitado corretamente ou se a sala já expirou após 24 horas.
          </p>
          <div className="pt-2">
            <Link href="/">
              <ToonButton variant="primary" className="w-full">
                VOLTAR PARA O INÍCIO
              </ToonButton>
            </Link>
          </div>
        </ToonCard>
      </div>
    );
  }

  // Jogador ainda não entrou ou precisa fornecer senha / dados
  if (!isJoined || !room || !me) {
    const rawStatus = minimalInfo?.status || room?.phase || 'lobby';
    const computedStatus: 'lobby' | 'playing' | 'finished' =
      rawStatus === 'finished' ? 'finished' : rawStatus === 'lobby' ? 'lobby' : 'playing';

    return (
      <div className="max-w-3xl mx-auto py-6 px-4">
        <JoinRoomScreen
          code={code}
          roomName={minimalInfo?.roomName || room?.config.roomName || 'Arena FDP'}
          hasPassword={Boolean(minimalInfo?.hasPassword ?? false)}
          playerCount={minimalInfo?.playerCount ?? room?.players.length ?? 0}
          status={computedStatus}
          occupiedColors={room?.players.filter((p) => p.status !== 'kicked').map((p) => p.color)}
          onJoined={reload}
        />
      </div>
    );
  }

  // FASE DO LOBBY (esperando jogadores)
  if (room.phase === 'lobby') {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4">
        <LobbyView
          room={room}
          me={me}
          isHost={isHost}
          connectionStatus={connectionStatus}
          onStartMatch={async () => {
            try {
              await sendAction({ type: 'START', actorId: me.id });
              showToast('Partida iniciada!', 'success');
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Falha ao iniciar';
              showToast(msg, 'error');
            }
          }}
          onKickPlayer={async (targetId) => {
            try {
              await sendAction({ type: 'KICK', actorId: me.id, targetId });
              showToast('Jogador expulso da sala', 'info');
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Falha ao expulsar';
              showToast(msg, 'error');
            }
          }}
          onLeaveRoom={leaveRoom}
        />
      </div>
    );
  }

  // PARTIDA EM ANDAMENTO OU FINALIZADA
  const isHostControl = isHost;
  const isFinished = room.phase === 'finished';
  const dealer = room.players.find((p) => p.id === room.dealerId);
  const selectedPlayer = room.players.find((p) => p.id === selectedPlayerId);

  const handleSetDamage = (targetId: string, damage: number) => {
    setPendingDamage((prev) => ({ ...prev, [targetId]: damage }));
  };

  const handleConfirmReport = async () => {
    try {
      const dmg = pendingDamage[me.id] ?? 0;
      await sendAction({
        type: 'SET_DAMAGE',
        actorId: me.id,
        targetId: me.id,
        damage: dmg,
      });
      await sendAction({
        type: 'CONFIRM',
        actorId: me.id,
      });
      showToast('Dano confirmado!', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao confirmar';
      showToast(msg, 'error');
    }
  };

  const handleNextRound = async () => {
    try {
      await sendAction({
        type: 'NEXT_ROUND',
        actorId: me.id,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao avançar rodada';
      showToast(msg, 'error');
    }
  };

  const handleRematch = async () => {
    try {
      await sendAction({
        type: 'REMATCH',
        actorId: me.id,
      });
      showToast('Revanche iniciada! Todos voltaram ao lobby.', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao pedir revanche';
      showToast(msg, 'error');
    }
  };

  const handleHostAdjust = async (targetId: string, delta: 1 | -1) => {
    try {
      await sendAction({
        type: 'HOST_ADJUST',
        actorId: me.id,
        targetId,
        delta,
      });
      showToast(`Vida ajustada (${delta > 0 ? '+1' : '-1'})`, 'info');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao ajustar vida';
      showToast(msg, 'error');
    }
  };

  const handleUndo = async () => {
    try {
      await sendAction({
        type: 'UNDO_LAST_ROUND',
        actorId: me.id,
      });
      showToast('Última rodada desfeita com sucesso!', 'info');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao desfazer';
      showToast(msg, 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Barra de Status e Telão */}
      <div className="flex justify-between items-center bg-white p-3 rounded-2xl border-2 border-black shadow-[4px_4px_0px_#111111]">
        <div className="flex items-center gap-2">
          <Badge variant="host">{room.config.roomName}</Badge>
          <Badge variant="default">SALA: {code}</Badge>
          <Badge variant={connectionStatus === 'connected' ? 'online' : 'default'}>
            {connectionStatus === 'connected' ? 'ONLINE' : 'RECONECTANDO'}
          </Badge>
          {isSpectator && <Badge variant="spectator">ESPECTADOR</Badge>}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="text-xs font-bold font-[family-name:var(--font-heading)] bg-gray-100 hover:bg-gray-200 border-2 border-black px-3 py-1 rounded-xl shadow-[2px_2px_0px_#111111]"
          >
            {isFullscreen ? 'TELA NORMAL' : 'TELA CHEIA'}
          </button>
          <button
            onClick={leaveRoom}
            className="text-xs font-bold text-red-600 hover:text-red-800 underline px-1"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Cabeçalho da Rodada */}
      {!isFinished && (
        <RoundHeader
          roundNumber={room.roundNumber}
          cardsThisRound={room.cardsThisRound}
          dealerName={dealer?.name}
        />
      )}

      {/* Grid de Jogadores */}
      <PlayerGrid
        players={room.players}
        hostId={room.hostId}
        dealerId={room.dealerId}
        lifeVisibility={room.config.lifeVisibility}
        selectedPlayerId={selectedPlayerId}
        onSelectPlayer={setSelectedPlayerId}
      />

      {/* Fase 1: Rodada em Andamento */}
      {room.phase === 'round' && (
        <ToonCard className="p-6 text-center space-y-4">
          <div className="space-y-1">
            <h3 className="font-black font-[family-name:var(--font-heading)] text-2xl text-black">
              A RODADA ESTÁ ROLANDO! 🃏
            </h3>
            <p className="text-sm text-gray-600 font-bold">
              Joguem a mão física. Quando a rodada terminar, o Host abrirá o reporte de dano.
            </p>
          </div>

          {isHostControl ? (
            <ToonButton
              variant="primary"
              size="lg"
              onClick={async () => {
                try {
                  await sendAction({ type: 'END_ROUND', actorId: me.id });
                } catch (err) {
                  const msg = err instanceof Error ? err.message : 'Erro ao finalizar rodada';
                  showToast(msg, 'error');
                }
              }}
              className="w-full text-xl py-3"
            >
              ENCERRAR RODADA E MARCAR DANOS! 🥊
            </ToonButton>
          ) : (
            <p className="text-xs text-gray-500 font-bold animate-pulse">
              Aguardando o Organizador abrir a apuração de danos...
            </p>
          )}
        </ToonCard>
      )}

      {/* Fase 2: Reporte de Danos */}
      {room.phase === 'reporting' && (
        <ReportPanel
          players={room.players}
          pendingDamage={pendingDamage}
          onSetDamage={handleSetDamage}
          onSubmitReport={handleConfirmReport}
        />
      )}

      {/* Fase 3: Revelação Dramática Toon FX */}
      {room.phase === 'reveal' && room.lastReveal && (
        <ToonCard className="p-6 space-y-4">
          <h3 className="font-black font-[family-name:var(--font-heading)] text-2xl text-center text-black">
            💥 HORA DO GOLPE! 💥
          </h3>
          <FxDirector
            reveal={room.lastReveal}
            players={room.players}
            showHitCount={room.config.showHitCount}
            onFinish={() => {}}
          />
          {isHostControl && (
            <ToonButton
              variant="primary"
              size="lg"
              onClick={handleNextRound}
              className="w-full text-xl py-3 mt-4"
            >
              PRÓXIMA RODADA! ➡️
            </ToonButton>
          )}
        </ToonCard>
      )}

      {/* Fase 4: Fim de Jogo e Vitória */}
      {isFinished && (
        <VictoryFx
          isTie={(room.winners?.length ?? 0) > 1}
          winnerName={room.players.find((p) => p.id === room.winners?.[0])?.name}
          winnerColor={room.players.find((p) => p.id === room.winners?.[0])?.color}
          tiedWinners={room.players
            .filter((p) => room.winners?.includes(p.id))
            .map((p) => ({ name: p.name, color: p.color }))}
        />
      )}

      {isFinished && isHostControl && (
        <ToonButton
          variant="yellow"
          size="lg"
          onClick={handleRematch}
          className="w-full text-xl py-4"
        >
          🔄 JOGAR NOVAMENTE (REVANCHE)
        </ToonButton>
      )}

      {/* Propostas e Ajustes do Host */}
      <ProposalBar
        selectedPlayer={selectedPlayer}
        canUndo={Boolean(room.prevSnapshot)}
        activeProposal={room.proposals.find((p) => p.status === 'pending')}
        currentUserId={me.id}
        players={room.players}
        isHost={isHostControl}
        onVoteProposal={async (proposalId, approve) => {
          try {
            await sendAction({
              type: 'VOTE',
              actorId: me.id,
              proposalId,
              approve,
            });
            showToast(approve ? 'Voto de aprovação registrado!' : 'Voto contra registrado!', 'info');
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Erro ao votar';
            showToast(msg, 'error');
          }
        }}
        onAdjustLife={(delta) => {
          if (!selectedPlayerId) return;
          if (isHostControl) {
            handleHostAdjust(selectedPlayerId, delta);
          } else {
            sendAction({
              type: 'PROPOSE_ADJUST',
              actorId: me.id,
              targetId: selectedPlayerId,
              delta,
            })
              .then(() => showToast('Proposta enviada para aprovação!', 'info'))
              .catch((err) => showToast(err.message || 'Falha ao propor ajuste', 'error'));
          }
        }}
        onUndoLastRound={isHostControl ? handleUndo : () => {}}
        onKickPlayer={
          isHostControl
            ? (targetId) => {
                sendAction({ type: 'KICK', actorId: me.id, targetId });
              }
            : undefined
        }
      />

      {/* Log de Eventos Toon ("O que rolou") — Task 7.6 */}
      <details className="bg-white border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_#111111] group">
        <summary className="font-cartoon text-sm text-black cursor-pointer flex justify-between items-center select-none">
          <span>📜 O QUE ROLOU NA ARENA</span>
          <span className="text-xs text-gray-500 font-bold group-open:rotate-180 transition-transform">
            ▼
          </span>
        </summary>
        <div className="mt-3 space-y-1.5 text-xs text-gray-700 max-h-48 overflow-y-auto pt-2 border-t border-gray-100">
          <p className="font-bold">
            ⚔️ <strong>Rodada {room.roundNumber}</strong>: {room.cardsThisRound} carta(s) por jogador.
          </p>
          {dealer && (
            <p>
              🃏 <strong>{dealer.name}</strong> é o distribuidor de cartas da rodada.
            </p>
          )}
          {room.lastReveal && (
            <p className="text-toon-blue font-bold">
              💥 <strong>Última Revelação:</strong> {room.lastReveal.hits.length} golpe(s) cartoon desferidos!
            </p>
          )}
          {room.confirmed.length > 0 && (
            <p className="text-green-700">
              ✓ {room.confirmed.length} guerreiro(s) confirmaram seus danos na apuração.
            </p>
          )}
        </div>
      </details>
    </div>
  );
}
