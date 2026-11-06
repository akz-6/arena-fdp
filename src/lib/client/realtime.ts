'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GameState, GameAction, Player } from '../engine/types';
import { api, ApiError } from './api';
import { getRoomToken, removeRoomToken } from './room-tokens';
import { getBrowserSupabase } from './supabase';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline';

export interface UseRoomResult {
  room: GameState | null;
  minimalInfo: {
    roomName: string;
    hasPassword: boolean;
    playerCount: number;
    status: 'lobby' | 'playing' | 'finished';
  } | null;
  token: string | null;
  me: Player | null;
  isHost: boolean;
  isSpectator: boolean;
  isJoined: boolean;
  loading: boolean;
  error: string | null;
  connectionStatus: ConnectionStatus;
  sendAction: (action: GameAction) => Promise<boolean>;
  leaveRoom: () => Promise<void>;
  reload: () => Promise<void>;
}

export function useRoom(code: string): UseRoomResult {
  const cleanCode = useMemo(() => code.toUpperCase(), [code]);

  const [room, setRoom] = useState<GameState | null>(null);
  const [minimalInfo, setMinimalInfo] = useState<{
    roomName: string;
    hasPassword: boolean;
    playerCount: number;
    status: 'lobby' | 'playing' | 'finished';
  } | null>(null);

  const [token, setTokenState] = useState<string | null>(() => getRoomToken(cleanCode));
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');

  const roomRef = useRef<GameState | null>(null);
  const tokenRef = useRef<string | null>(token);
  const lastEventTimeRef = useRef<number>(0);
  const awayTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // Carrega snapshot público do servidor
  const fetchSnapshot = useCallback(async () => {
    try {
      const currentToken = tokenRef.current || getRoomToken(cleanCode);
      const res = await api.getRoomState(cleanCode, currentToken);

      if (res.minimal) {
        setMinimalInfo({
          roomName: res.roomName,
          hasPassword: res.hasPassword,
          playerCount: res.playerCount,
          status: res.status,
        });
        setRoom(null);
      } else {
        const incomingRoom = res.room as GameState;
        // Ignora versões menores que a atual para evitar desatualização por lag
        if (!roomRef.current || incomingRoom.version >= roomRef.current.version) {
          setRoom(incomingRoom);
          setMinimalInfo(null);
        }
      }
      setError(null);
      setConnectionStatus('connected');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('Sala não encontrada');
      } else {
        setConnectionStatus('offline');
      }
    } finally {
      setLoading(false);
    }
  }, [cleanCode]);

  // Envio de ação com retry automático em caso de concorrência (409)
  const sendAction = useCallback(
    async (action: GameAction): Promise<boolean> => {
      const currentToken = tokenRef.current || getRoomToken(cleanCode);
      if (!currentToken) {
        setError('Você precisa entrar na sala para realizar ações');
        return false;
      }

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await api.sendRoomAction(cleanCode, currentToken, action);
          if (res.room) {
            setRoom(res.room);
            lastEventTimeRef.current = Date.now();
          }
          return true;
        } catch (err) {
          if (err instanceof ApiError) {
            if (err.status === 409 && attempt < 2) {
              // Conflito de versão -> recarrega snapshot e tenta novamente
              await fetchSnapshot();
              continue;
            }
            throw err;
          }
          throw err;
        }
      }
      return false;
    },
    [cleanCode, fetchSnapshot]
  );

  // Sair da sala
  const leaveRoom = useCallback(async () => {
    const currentToken = tokenRef.current;
    if (currentToken && roomRef.current) {
      try {
        const myPlayer = roomRef.current.players.find(
          (p) => p.id === (actionActorIdFromToken(currentToken) || '')
        );
        if (myPlayer) {
          await api.sendRoomAction(cleanCode, currentToken, {
            type: 'LEAVE',
            actorId: myPlayer.id,
          });
        }
      } catch {
        // Ignora falhas de rede ao sair
      }
    }
    removeRoomToken(cleanCode);
    setTokenState(null);
    await fetchSnapshot();
  }, [cleanCode, fetchSnapshot]);

  // Inicia conexão em tempo real via Supabase Broadcast e reconciliação periódica
  useEffect(() => {
    let isMounted = true;
    fetchSnapshot();

    const supabase = getBrowserSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any = null;

    if (supabase) {
      channel = supabase
        .channel(`room:${cleanCode}`)
        .on('broadcast', { event: 'state' }, ({ payload }) => {
          if (!isMounted || !payload?.room) return;
          lastEventTimeRef.current = Date.now();
          const incoming = payload.room as GameState;
          setRoom((prev) => {
            if (!prev || incoming.version >= prev.version) {
              return incoming;
            }
            return prev;
          });
          setConnectionStatus('connected');
        })
        .subscribe((status) => {
          if (!isMounted) return;
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected');
          } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
            setConnectionStatus('reconnecting');
          }
        });
    }

    // Polling de segurança a cada 10 segundos caso o canal fique silencioso
    const heartbeatTimer = setInterval(() => {
      if (Date.now() - lastEventTimeRef.current > 10_000) {
        fetchSnapshot();
      }
    }, 10_000);

    // Reconciliação imediata quando o usuário volta para a aba
    const handleFocus = () => {
      fetchSnapshot();
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(heartbeatTimer);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleFocus);
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [cleanCode, fetchSnapshot]);

  // Detecção de presença (away se aba oculta por mais de 60s)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        awayTimerRef.current = setTimeout(() => {
          const currentToken = tokenRef.current;
          const mePlayer = getMyPlayer(roomRef.current, currentToken);
          if (mePlayer && mePlayer.status === 'alive') {
            sendAction({
              type: 'SET_AWAY',
              actorId: mePlayer.id,
              isAway: true,
            }).catch(() => {});
          }
        }, 60_000);
      } else {
        if (awayTimerRef.current) {
          clearTimeout(awayTimerRef.current);
          awayTimerRef.current = null;
        }
        const currentToken = tokenRef.current;
        const mePlayer = getMyPlayer(roomRef.current, currentToken);
        if (mePlayer && mePlayer.status === 'away') {
          sendAction({
            type: 'SET_AWAY',
            actorId: mePlayer.id,
            isAway: false,
          }).catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (awayTimerRef.current) clearTimeout(awayTimerRef.current);
    };
  }, [sendAction]);

  // Identificação do jogador local
  const me = useMemo(() => {
    return getMyPlayer(room, token);
  }, [room, token]);

  const isHost = useMemo(() => {
    if (!room || !me) return false;
    return room.hostId === me.id;
  }, [room, me]);

  const isSpectator = useMemo(() => {
    if (!me) return true;
    return me.role === 'spectator';
  }, [me]);

  return {
    room,
    minimalInfo,
    token,
    me,
    isHost,
    isSpectator,
    isJoined: Boolean(me),
    loading,
    error,
    connectionStatus,
    sendAction,
    leaveRoom,
    reload: fetchSnapshot,
  };
}

// Helpers internos para decodificar playerId do payload JWT sem expor biblioteca no client bundle
function actionActorIdFromToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2 || !parts[1]) return null;
    const json = atob(parts[1]);
    const payload = JSON.parse(json);
    return typeof payload.playerId === 'string' ? payload.playerId : null;
  } catch {
    return null;
  }
}

function getMyPlayer(room: GameState | null, token: string | null): Player | null {
  if (!room || !token) return null;
  const myId = actionActorIdFromToken(token);
  if (!myId) return null;
  return room.players.find((p) => p.id === myId) ?? null;
}
