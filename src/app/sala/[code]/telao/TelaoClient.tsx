'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRoom } from '@/lib/client/realtime';
import { RoundHeader } from '@/components/game/RoundHeader';
import { PlayerGrid } from '@/components/game/PlayerGrid';
import { FxDirector } from '@/components/fx/FxDirector';
import { VictoryFx } from '@/components/fx/VictoryFx';
import { ToonCard } from '@/components/ui/ToonCard';
import { ToonButton } from '@/components/ui/ToonButton';
import { ToonInput } from '@/components/ui/ToonInput';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/client/api';
import { setRoomToken } from '@/lib/client/room-tokens';

interface TelaoClientProps {
  code: string;
}

export default function TelaoClient({ code }: TelaoClientProps) {
  const { room, minimalInfo, connectionStatus, reload } = useRoom(code);

  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Wake Lock para evitar que o telão apague a tela
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch {
        // Ignora
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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');

    try {
      // Entra como espectador no telão
      const res = await api.joinRoom(code, {
        password: password.trim() || undefined,
        name: 'Telão TV',
        role: 'spectator',
      });
      setRoomToken(code, res.token);
      await reload();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setPasswordError('Senha incorreta para abrir o telão');
      } else {
        setPasswordError('Erro ao conectar ao telão');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  // Se a sala exige senha e o telão ainda não está autorizado
  if (!room && minimalInfo?.hasPassword) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <ToonCard className="max-w-md w-full p-8 text-center space-y-6">
          <div className="text-5xl">📺</div>
          <h2 className="font-cartoon text-3xl text-black">TELÃO PROTEGIDO</h2>
          <p className="text-sm text-gray-600 font-bold">
            Digite a senha da arena <strong>{minimalInfo.roomName}</strong> para projetar a partida no telão.
          </p>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-left">
            <ToonInput
              label="Senha da Sala"
              type="password"
              placeholder="Digite a senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {passwordError && (
              <p className="text-xs font-bold text-red-600 text-center">{passwordError}</p>
            )}
            <ToonButton
              type="submit"
              variant="primary"
              size="lg"
              disabled={passwordLoading}
              className="w-full text-xl"
            >
              {passwordLoading ? 'CONECTANDO...' : 'ABRIR TELÃO 📺'}
            </ToonButton>
          </form>
        </ToonCard>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-16 h-16 border-4 border-black border-t-toon-yellow rounded-full animate-spin shadow-[4px_4px_0px_#111111]" />
        <p className="font-cartoon text-2xl text-black">Sincronizando Telão da Arena {code}...</p>
      </div>
    );
  }

  const dealer = room.players.find((p) => p.id === room.dealerId);
  const isFinished = room.phase === 'finished';

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-4 sm:p-8 flex flex-col justify-between space-y-6">
      {/* Barra Superior do Telão */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border-4 border-black shadow-[6px_6px_0px_#111111]">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📺</span>
          <div>
            <h1 className="font-cartoon text-3xl sm:text-4xl text-black tracking-wide">
              {room.config.roomName}
            </h1>
            <p className="text-xs sm:text-sm font-bold text-gray-500">
              MODO TELÃO • ARENA FDP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-bold text-gray-400 block">CÓDIGO DA SALA</span>
            <span className="font-cartoon text-3xl sm:text-4xl text-toon-blue tracking-widest">
              {code}
            </span>
          </div>
          <Badge variant={connectionStatus === 'connected' ? 'online' : 'default'} className="text-sm px-3 py-1">
            {connectionStatus === 'connected' ? 'AO VIVO' : 'RECONECTANDO'}
          </Badge>
          <button
            onClick={toggleFullscreen}
            className="font-cartoon text-sm bg-gray-100 hover:bg-gray-200 border-2 border-black px-4 py-2 rounded-xl shadow-[2px_2px_0px_#111111]"
          >
            {isFullscreen ? 'TELA NORMAL' : 'TELA CHEIA ⛶'}
          </button>
        </div>
      </div>

      {/* Conteúdo Principal do Telão */}
      <div className="flex-1 flex flex-col justify-center space-y-6 max-w-6xl mx-auto w-full">
        {/* Cabeçalho da Rodada (em tamanho grande) */}
        {!isFinished && (
          <div className="scale-105 sm:scale-110 my-2">
            <RoundHeader
              roundNumber={room.roundNumber}
              cardsThisRound={room.cardsThisRound}
              dealerName={dealer?.name}
              isTelao={true}
            />
          </div>
        )}

        {/* FASE: LOBBY */}
        {room.phase === 'lobby' && (
          <div className="text-center py-8 space-y-6">
            <h2 className="font-cartoon text-4xl text-black animate-pulse">
              AGUARDANDO O INÍCIO DA BATALHA! 🃏
            </h2>
            <p className="text-xl font-bold text-gray-600">
              Abra a câmera do celular ou acesse a sala com o código <strong className="text-toon-blue">{code}</strong>
            </p>
            <PlayerGrid
              players={room.players}
              hostId={room.hostId}
              dealerId={room.dealerId}
              lifeVisibility={room.config.lifeVisibility}
              isTelao={true}
            />
          </div>
        )}

        {/* FASE: ROUND */}
        {room.phase === 'round' && (
          <div className="space-y-6">
            <div className="text-center py-4">
              <h2 className="font-cartoon text-3xl sm:text-4xl text-black">
                A MÃO FÍSICA ESTÁ SENDO DISPUTADA! 🎴
              </h2>
              <p className="text-lg font-bold text-gray-600 mt-1">
                Distribuidor da vez: <span className="text-toon-blue font-cartoon">{dealer?.name || 'Aguardando'}</span>
              </p>
            </div>
            <PlayerGrid
              players={room.players}
              hostId={room.hostId}
              dealerId={room.dealerId}
              lifeVisibility={room.config.lifeVisibility}
              isTelao={true}
            />
          </div>
        )}

        {/* FASE: REPORTING */}
        {room.phase === 'reporting' && (
          <div className="text-center py-6 space-y-6">
            <h2 className="font-cartoon text-3xl sm:text-4xl text-black animate-pulse">
              APURAÇÃO DE DANOS DA RODADA 🥊
            </h2>
            <p className="text-lg font-bold text-gray-600">
              Os jogadores estão confirmando suas quedas nos celulares...
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {room.players
                .filter((p) => p.status === 'alive' && p.role === 'player')
                .map((p) => {
                  const hasConfirmed = room.confirmed.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-2xl border-3 border-black font-cartoon text-xl flex items-center gap-2 shadow-[4px_4px_0px_#111111] ${
                        hasConfirmed ? 'bg-green-100 text-green-900' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span>{hasConfirmed ? '✓' : '⏳'}</span>
                      <span>{p.name}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* FASE: REVEAL (Animações Toon sincronizadas no Telão) */}
        {room.phase === 'reveal' && room.lastReveal && (
          <div className="py-6 space-y-6 text-center">
            <h2 className="font-cartoon text-4xl sm:text-5xl text-black animate-bounce">
              💥 HORA DA REVELAÇÃO! 💥
            </h2>
            <div className="bg-white p-6 rounded-3xl border-4 border-black shadow-[8px_8px_0px_#111111]">
              <FxDirector
                reveal={room.lastReveal}
                players={room.players}
                showHitCount={room.config.showHitCount}
                isTelao={true}
                onFinish={() => {}}
              />
            </div>
          </div>
        )}

        {/* FASE: FINISHED (Fim de Jogo e Vitória no Telão) */}
        {isFinished && (
          <div className="py-8">
            <VictoryFx
              isTie={(room.winners?.length ?? 0) > 1}
              winnerName={room.players.find((p) => p.id === room.winners?.[0])?.name}
              winnerColor={room.players.find((p) => p.id === room.winners?.[0])?.color}
              tiedWinners={room.players
                .filter((p) => room.winners?.includes(p.id))
                .map((p) => ({ name: p.name, color: p.color }))}
              isTelao={true}
            />
          </div>
        )}
      </div>

      {/* Rodapé do Telão */}
      <div className="flex justify-between items-center text-xs text-gray-500 pt-4 border-t-2 border-gray-200">
        <Link href={`/sala/${code}`} className="hover:underline font-bold">
          ← Entrar como Jogador
        </Link>
        <span className="font-cartoon text-sm text-black">
          ARENA FDP • A partida só acaba quando sobra um.
        </span>
      </div>
    </div>
  );
}
