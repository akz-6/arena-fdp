'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, Player } from '@/lib/engine/types';
import { ToonButton } from '../ui/ToonButton';
import { ToonCard } from '../ui/ToonCard';
import { Badge } from '../ui/Badge';
import { Avatar } from '../toon/Avatar';
import { QrCodeModal } from './QrCodeModal';
import { ConnectionStatus } from '@/lib/client/realtime';

interface LobbyViewProps {
  room: GameState;
  me: Player | null;
  isHost: boolean;
  connectionStatus: ConnectionStatus;
  onStartMatch: () => void;
  onKickPlayer: (targetId: string) => void;
  onLeaveRoom: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  room,
  me,
  isHost,
  connectionStatus,
  onStartMatch,
  onKickPlayer,
  onLeaveRoom,
}) => {
  const [showQr, setShowQr] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [kickTarget, setKickTarget] = useState<Player | null>(null);

  const activePlayers = room.players.filter((p) => p.status !== 'kicked');
  const actualPlayers = activePlayers.filter((p) => p.role === 'player');
  const spectators = activePlayers.filter((p) => p.role === 'spectator');

  const currentRoomUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentRoomUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Arena FDP — ${room.config.roomName}`,
          text: `Entre na minha sala da Arena FDP com o código: ${room.hostId ? '...' : ''}`,
          url: currentRoomUrl,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const canStart = isHost && actualPlayers.length >= 2;

  return (
    <div className="space-y-6">
      {/* 1. Header do Lobby */}
      <ToonCard className="p-4 sm:p-6 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-black pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-cartoon text-2xl sm:text-3xl text-black">
                {room.config.roomName}
              </h2>
              <Badge
                variant={connectionStatus === 'connected' ? 'online' : 'default'}
                className="text-xs"
              >
                {connectionStatus === 'connected'
                  ? 'AO VIVO'
                  : connectionStatus === 'reconnecting'
                  ? 'RECONECTANDO...'
                  : 'OFFLINE'}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 font-bold">
              {room.config.expectedPlayers
                ? `${actualPlayers.length}/${room.config.expectedPlayers} Jogadores`
                : `${actualPlayers.length} Jogadores na Sala`}
              {spectators.length > 0 && ` • ${spectators.length} Espectador(es)`}
            </p>
          </div>

          {/* Código da Sala em Destaque */}
          <div className="flex flex-col items-center sm:items-end">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Código da Sala
            </span>
            <span className="font-cartoon text-4xl text-toon-blue tracking-widest select-all">
              {/* O código é extraído da URL ou contexto */}
              {typeof window !== 'undefined' ? window.location.pathname.split('/').pop()?.toUpperCase() : ''}
            </span>
          </div>
        </div>

        {/* Botões de Ação de Compartilhamento */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
          <ToonButton
            variant="secondary"
            size="sm"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5"
          >
            📋 {copied ? 'COPIADO! ✓' : 'COPIAR LINK'}
          </ToonButton>

          <ToonButton
            variant="secondary"
            size="sm"
            onClick={handleShare}
            className="flex items-center gap-1.5"
          >
            📤 COMPARTILHAR
          </ToonButton>

          <ToonButton
            variant="secondary"
            size="sm"
            onClick={() => setShowQr(true)}
            className="flex items-center gap-1.5"
          >
            📱 QR CODE
          </ToonButton>
        </div>
      </ToonCard>

      {/* 2. Grid de Jogadores Ao Vivo */}
      <div className="space-y-3">
        <h3 className="font-cartoon text-xl text-black flex items-center justify-between">
          <span>GUERREIROS NA SALA ({actualPlayers.length})</span>
          {isHost && (
            <span className="text-xs font-sans text-gray-500 font-normal">
              Você é o Organizador (Host) 👑
            </span>
          )}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {actualPlayers.map((player) => {
              const isPlayerHost = player.id === room.hostId;
              const isMe = player.id === me?.id;

              return (
                <motion.div
                  key={player.id}
                  layout
                  initial={{ scale: 0.5, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.5, opacity: 0, y: -20 }}
                  transition={{ type: 'spring', damping: 15 }}
                >
                  <ToonCard
                    className={`p-4 flex flex-col items-center text-center relative ${
                      isMe ? 'ring-3 ring-toon-blue' : ''
                    }`}
                  >
                    <Avatar
                      color={player.color}
                      size="lg"
                      status={player.status === 'away' ? 'away' : 'idle'}
                      isHost={isPlayerHost}
                    />

                    <div className="mt-2 w-full">
                      <p className="font-cartoon text-lg truncate text-black" title={player.name}>
                        {player.name}
                      </p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        {isMe && <Badge variant="playing">VOCÊ</Badge>}
                        {isPlayerHost && <Badge variant="host">HOST</Badge>}
                        {player.status === 'away' && <Badge variant="default">AUSENTE</Badge>}
                      </div>
                    </div>

                    {/* Botão de expulsão (visível apenas para o Host sobre outros jogadores) */}
                    {isHost && !isPlayerHost && (
                      <button
                        onClick={() => setKickTarget(player)}
                        className="mt-3 text-xs font-bold text-red-600 hover:text-red-800 underline p-1"
                        title="Expulsar jogador"
                      >
                        Expulsar ✕
                      </button>
                    )}
                  </ToonCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. Espectadores (se houver) */}
      {spectators.length > 0 && (
        <div className="space-y-2 pt-2">
          <h4 className="font-cartoon text-sm text-gray-600 uppercase tracking-wider">
            Espectadores ({spectators.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {spectators.map((spec) => (
              <Badge key={spec.id} variant="spectator" className="text-xs">
                👁️ {spec.name} {spec.id === me?.id ? '(Você)' : ''}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* 4. Painel Inferior de Controles */}
      <ToonCard className="p-4 sm:p-6 bg-white space-y-3">
        {isHost ? (
          <div className="space-y-2">
            <ToonButton
              variant="primary"
              size="lg"
              disabled={!canStart}
              onClick={onStartMatch}
              className="w-full text-xl py-4"
            >
              🚀 INICIAR PARTIDA
            </ToonButton>
            {!canStart && (
              <p className="text-center text-xs font-bold text-gray-500">
                Aguarde pelo menos 2 jogadores entrarem na sala para começar a batalha.
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-2 space-y-1">
            <p className="font-cartoon text-lg text-black animate-pulse">
              Aguardando o Organizador iniciar a partida...
            </p>
            <p className="text-xs text-gray-500 font-bold">
              Preparem as cartas! A partida pode começar a qualquer momento.
            </p>
          </div>
        )}

        <div className="pt-2 border-t-2 border-gray-100 flex justify-between items-center">
          <button
            onClick={onLeaveRoom}
            className="text-sm font-bold text-gray-600 hover:text-red-600 underline"
          >
            ← Sair da Sala
          </button>
          <span className="text-xs text-gray-400">
            Regra: {room.config.lifeVisibility === 'hidden' ? 'Vidas Ocultas 🤫' : 'Vidas Visíveis 👀'}
          </span>
        </div>
      </ToonCard>

      {/* Modal de QR Code */}
      <QrCodeModal
        url={currentRoomUrl}
        code={typeof window !== 'undefined' ? window.location.pathname.split('/').pop()?.toUpperCase() || '' : ''}
        isOpen={showQr}
        onClose={() => setShowQr(false)}
      />

      {/* Confirmação de Expulsão */}
      {kickTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <ToonCard className="max-w-sm w-full p-6 text-center space-y-4">
            <h3 className="font-cartoon text-xl text-black">EXPULSAR JOGADOR?</h3>
            <p className="text-sm text-gray-700">
              Tem certeza que deseja chutar <strong>{kickTarget.name}</strong> para fora da arena?
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <ToonButton
                variant="secondary"
                onClick={() => setKickTarget(null)}
                className="w-1/2"
              >
                CANCELAR
              </ToonButton>
              <ToonButton
                variant="danger"
                onClick={() => {
                  onKickPlayer(kickTarget.id);
                  setKickTarget(null);
                }}
                className="w-1/2"
              >
                EXPULSAR!
              </ToonButton>
            </div>
          </ToonCard>
        </div>
      )}
    </div>
  );
};
