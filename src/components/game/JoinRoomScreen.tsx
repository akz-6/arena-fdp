'use client';

import React, { useState } from 'react';
import { ToonCard } from '../ui/ToonCard';
import { ToonButton } from '../ui/ToonButton';
import { ToonInput } from '../ui/ToonInput';
import { ColorPicker } from '../ui/ColorPicker';
import { Avatar } from '../toon/Avatar';
import { useProfileStore } from '@/lib/client/profile-store';
import { api, ApiError } from '@/lib/client/api';
import { setRoomToken } from '@/lib/client/room-tokens';
import { ROOM_PALETTE } from '@/lib/engine/names';

interface JoinRoomScreenProps {
  code: string;
  roomName: string;
  hasPassword: boolean;
  playerCount: number;
  status: 'lobby' | 'playing' | 'finished';
  occupiedColors?: string[];
  onJoined: () => void;
}

export const JoinRoomScreen: React.FC<JoinRoomScreenProps> = ({
  code,
  roomName,
  hasPassword,
  playerCount,
  status,
  occupiedColors = [],
  onJoined,
}) => {
  const profile = useProfileStore((s) => s.profile);

  const [useProfile, setUseProfile] = useState<boolean>(Boolean(profile));
  const [password, setPassword] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [customColor, setCustomColor] = useState<string>(() => {
    // Escolhe uma cor livre
    const taken = new Set(occupiedColors.map((c) => c.toLowerCase()));
    return ROOM_PALETTE.find((c) => !taken.has(c.toLowerCase())) || ROOM_PALETTE[0];
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isOngoing = status !== 'lobby';

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        password: hasPassword ? password : undefined,
        name: useProfile && profile ? profile.name : customName.trim() || undefined,
        color: useProfile && profile ? profile.color : customColor || undefined,
        role: isOngoing ? ('spectator' as const) : undefined,
      };

      const res = await api.joinRoom(code, payload);
      setRoomToken(code, res.token);
      onJoined();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError('Senha incorreta para entrar nesta sala');
        } else if (err.status === 429) {
          setError('Muitas tentativas com senha incorreta. Aguarde um minuto.');
        } else if (err.status === 422) {
          setError(err.message || 'Esta cor ou nome já foi escolhido na sala');
        } else {
          setError(err.message || 'Erro ao entrar na sala');
        }
      } else {
        setError('Erro de conexão ao entrar na sala');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <ToonCard className="p-6 bg-white space-y-5 text-center">
        <div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Entrando na Arena
          </span>
          <h2 className="font-cartoon text-3xl text-black">{roomName}</h2>
          <p className="text-sm text-gray-600 font-bold mt-1">
            Código: <span className="text-toon-blue font-cartoon">{code}</span> • {playerCount} jogador(es)
          </p>
          {isOngoing && (
            <div className="mt-2 p-2 bg-yellow-100 border-2 border-black rounded-xl text-xs font-bold text-yellow-900">
              ⚠️ A partida já está em andamento! Você entrará como <strong>Espectador</strong>.
            </div>
          )}
        </div>

        <form onSubmit={handleJoin} className="space-y-4 text-left">
          {/* Campo de Senha se a sala for protegida */}
          {hasPassword && (
            <ToonInput
              label="Senha da Sala"
              type="password"
              placeholder="Digite a senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          )}

          {/* Opção 1: Entrar com Perfil Existente */}
          {profile && useProfile ? (
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 border-2 border-black rounded-xl flex items-center gap-4">
                <Avatar color={profile.color} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-cartoon text-xl truncate text-black">{profile.name}</p>
                  <p className="text-xs text-gray-500">Seu perfil global Arena FDP</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setUseProfile(false)}
                className="text-xs font-bold text-toon-blue hover:underline block text-center w-full"
              >
                Entrar com outro apelido ou cor nesta sala
              </button>
            </div>
          ) : (
            /* Opção 2: Apelido e Cor Customizados / Anônimos */
            <div className="space-y-4">
              <ToonInput
                label="Seu Apelido na Sala"
                placeholder="Ex: Pato Maluco (vazio = aleatório)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                maxLength={16}
              />

              <div>
                <label className="block font-cartoon text-sm text-black mb-1">
                  Sua Cor de Guerra
                </label>
                <ColorPicker
                  selectedColor={customColor}
                  onSelectColor={setCustomColor}
                  takenColors={occupiedColors}
                />
              </div>

              {profile && (
                <button
                  type="button"
                  onClick={() => setUseProfile(true)}
                  className="text-xs font-bold text-toon-blue hover:underline block text-center w-full pt-1"
                >
                  ← Voltar para meu perfil ({profile.name})
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-100 border-2 border-red-800 rounded-xl text-red-800 text-xs font-bold text-center">
              {error}
            </div>
          )}

          <ToonButton
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="w-full text-xl py-3"
          >
            {loading ? 'ENTRANDO...' : 'ENTRAR NA ARENA! 🚀'}
          </ToonButton>
        </form>
      </ToonCard>
    </div>
  );
};
