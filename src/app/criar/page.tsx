'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ToonCard,
  ToonButton,
  ToonInput,
  Stepper,
  Switch,
  Segmented,
  ColorPicker,
  useToast,
} from '@/components/ui';
import { Avatar } from '@/components/toon/Avatar';
import { useProfileStore } from '@/lib/client/profile-store';
import { useLocalGamesStore } from '@/lib/client/local-game-store';
import { createInitialState, reduce } from '@/lib/engine/reducer';
import { generateRandomName, pickAvailableColor } from '@/lib/engine/names';
import { createRng } from '@/lib/engine/rng';
import { GameConfig } from '@/lib/engine/types';
import { api, ApiError } from '@/lib/client/api';
import { setRoomToken } from '@/lib/client/room-tokens';

interface LobbyPlayer {
  id: string;
  name: string;
  color: string;
}

export default function CreateRoomPage() {
  const router = useRouter();
  const { profile } = useProfileStore();
  const { saveMatch } = useLocalGamesStore();
  const { showToast } = useToast();

  // Passo 1: Modo (Singleplayer vs Online)
  const [selectedMode, setSelectedMode] = useState<'single' | 'online'>('online');

  // Passo 2: Configuração da Partida
  const [roomName, setRoomName] = useState('Arena FDP');
  const [password, setPassword] = useState('');
  const [lifeMode, setLifeMode] = useState<'fixed' | 'random'>('fixed');
  const [lifeFixed, setLifeFixed] = useState(5);
  const [lifeMin, setLifeMin] = useState(3);
  const [lifeMax, setLifeMax] = useState(7);
  const [lifeRandomScope, setLifeRandomScope] = useState<'shared' | 'individual'>('individual');
  const [lifeVisibility, setLifeVisibility] = useState<'visible' | 'hidden'>('visible');
  const [hostRole, setHostRole] = useState<'player' | 'spectator'>('player');
  const [showHitCount, setShowHitCount] = useState(true);
  const [hasManualCap, setHasManualCap] = useState(false);
  const [maxCardsCap, setMaxCardsCap] = useState(7);
  const [isLimitedPlayers, setIsLimitedPlayers] = useState(false);
  const [expectedPlayers, setExpectedPlayers] = useState(4);
  const [isCreatingOnline, setIsCreatingOnline] = useState(false);
  const [hasSavedMatches, setHasSavedMatches] = useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('arena_fdp_local_matches_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.state?.matches && Object.keys(parsed.state.matches).length > 0) {
          setHasSavedMatches(true);
        }
      }
    } catch {}
  }, []);

  const handleHostRoleChange = (role: 'player' | 'spectator') => {
    setHostRole(role);
    if (role === 'spectator' && players.length < 3) {
      // Garante automaticamente pelo menos 2 jogadores ativos além do host espectador
      const occupiedNames = players.map((p) => p.name);
      const occupiedColors = players.map((p) => p.color);
      const rng = createRng(Date.now());
      const name = generateRandomName(occupiedNames, rng);
      const color = pickAvailableColor(occupiedColors, rng);
      setPlayers((prev) => [
        ...prev,
        { id: `p-${Date.now().toString(36)}`, name, color },
      ]);
    }
  };

  // Cadastro de Jogadores do Lobby Local (Modo Singleplayer)
  const [players, setPlayers] = useState<LobbyPlayer[]>(() => {
    const hostName = profile?.name || 'Organizador';
    const hostColor = profile?.color || '#FF3038';
    return [
      {
        id: 'host-1',
        name: hostName,
        color: hostColor,
      },
      {
        id: 'p-2',
        name: 'Pato Maluco',
        color: '#35B8F4',
      },
    ];
  });

  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerColor, setNewPlayerColor] = useState('#2ECC71');

  const handleAddPlayer = () => {
    const occupiedNames = players.map((p) => p.name);
    const occupiedColors = players.map((p) => p.color);
    const rng = createRng(Date.now());

    const finalName = newPlayerName.trim() || generateRandomName(occupiedNames, rng);
    const finalColor = newPlayerColor || pickAvailableColor(occupiedColors, rng);

    if (players.some((p) => p.name.toLowerCase() === finalName.toLowerCase())) {
      showToast('Já existe um jogador com esse nome!', 'error');
      return;
    }

    if (players.some((p) => p.color.toLowerCase() === finalColor.toLowerCase()) && players.length < 12) {
      showToast('Essa cor já está em uso nesta partida!', 'error');
      return;
    }

    setPlayers((prev) => [
      ...prev,
      {
        id: `p-${Date.now()}-${Math.floor(rng() * 1000)}`,
        name: finalName,
        color: finalColor,
      },
    ]);

    setNewPlayerName('');
    const nextColor = pickAvailableColor([...occupiedColors, finalColor], rng);
    setNewPlayerColor(nextColor);
    showToast(`Jogador "${finalName}" adicionado!`, 'success');
  };

  const handleRemovePlayer = (id: string) => {
    if (players.length <= 2) {
      showToast('São necessários no mínimo 2 jogadores!', 'error');
      return;
    }
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const handleCreateRoom = async () => {
    const gameConfig: GameConfig = {
      roomName: roomName.trim() || 'Arena FDP',
      lifeVisibility,
      lifeMode,
      lifeFixed,
      lifeMin,
      lifeMax,
      lifeRandomScope,
      hostRole,
      showHitCount,
      expectedPlayers: isLimitedPlayers ? expectedPlayers : null,
      maxCardsCap: hasManualCap ? maxCardsCap : null,
      decks: 'auto',
      operatorMode: selectedMode === 'single',
    };

    // MODO ONLINE (Fase 6)
    if (selectedMode === 'online') {
      setIsCreatingOnline(true);
      try {
        const res = await api.createRoom({
          config: gameConfig,
          password: password.trim() || undefined,
          hostProfile: profile
            ? { name: profile.name, color: profile.color }
            : undefined,
        });

        setRoomToken(res.code, res.token);
        showToast('Arena Online criada com sucesso! 🌐', 'success');
        router.push(`/sala/${res.code}`);
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Erro ao criar sala online';
        showToast(msg, 'error');
      } finally {
        setIsCreatingOnline(false);
      }
      return;
    }

    // MODO SINGLEPLAYER (Local)
    const activePlayerCount = hostRole === 'spectator' ? players.length - 1 : players.length;
    if (activePlayerCount < 2) {
      showToast(
        `O modo Singleplayer exige pelo menos 2 jogadores ativos (o Organizador Espectador não joga). Faltam ${2 - activePlayerCount} jogador(es)!`,
        'error'
      );
      return;
    }

    const hostPlayer = players[0];
    if (!hostPlayer) return;

    const roomId = `local-${Date.now().toString(36)}`;
    const seed = Date.now();
    const ctx = { now: Date.now(), rng: createRng(seed) };

    let state = createInitialState({
      host: {
        id: hostPlayer.id,
        name: hostPlayer.name,
        color: hostPlayer.color,
      },
      config: gameConfig,
      seed,
    });

    for (let i = 1; i < players.length; i++) {
      const p = players[i];
      if (p) {
        state = reduce(
          state,
          {
            type: 'ADD_PLAYER',
            actorId: p.id,
            player: {
              id: p.id,
              name: p.name,
              color: p.color,
            },
          },
          ctx
        ).state;
      }
    }

    saveMatch(roomId, state);
    showToast('Partida criada com sucesso!', 'success');
    router.push(`/local/${roomId}`);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start py-4 max-w-md mx-auto w-full gap-5">
      <div className="w-full text-center">
        <h1 className="text-3xl font-black font-[family-name:var(--font-heading)] text-[#111111]">
          Criar Sala
        </h1>
        <p className="text-xs text-[#666666] font-semibold mt-1">
          Configure a partida física e convide seus amigos
        </p>
      </div>

      {/* Atalho para continuar partida local existente */}
      {hasSavedMatches && (
        <div className="w-full p-3 bg-yellow-50 border-2 border-[#111111] rounded-xl flex items-center justify-between shadow-[2px_2px_0px_#111111]">
          <span className="text-xs font-bold text-[#111111]">
            📱 Você tem partidas salvas neste aparelho.
          </span>
          <Link href="/local">
            <span className="text-xs font-black text-toon-blue hover:underline">
              Retomar ➡️
            </span>
          </Link>
        </div>
      )}

      {/* Passo 1: Modo de Jogo */}
      <ToonCard padding="sm" className="w-full">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSelectedMode('online')}
            className={`p-3 rounded-[12px] border-2 border-[#111111] font-bold font-[family-name:var(--font-heading)] flex flex-col items-center text-center gap-1 transition-all cursor-pointer ${
              selectedMode === 'online'
                ? 'bg-[#0369A1] text-white shadow-[3px_3px_0px_#111111] scale-[1.02]'
                : 'bg-white hover:bg-[#F5F5F5] text-[#111111]'
            }`}
          >
            <span className="text-2xl">🌐</span>
            <span className="text-sm">Online</span>
            <span className={`text-[10px] ${selectedMode === 'online' ? 'text-white' : 'text-[#666666]'}`}>
              Multiplayer com link e QR
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMode('single')}
            className={`p-3 rounded-[12px] border-2 border-[#111111] font-bold font-[family-name:var(--font-heading)] flex flex-col items-center text-center gap-1 transition-all cursor-pointer ${
              selectedMode === 'single'
                ? 'bg-[#FFC233] shadow-[3px_3px_0px_#111111] scale-[1.02]'
                : 'bg-white hover:bg-[#F5F5F5]'
            }`}
          >
            <span className="text-2xl">📱</span>
            <span className="text-sm text-[#111111]">Singleplayer</span>
            <span className="text-[10px] text-[#666666]">Offline • Neste aparelho</span>
          </button>
        </div>
      </ToonCard>

      {/* Passo 2: Configurações da Partida */}
      <ToonCard padding="md" className="w-full flex flex-col gap-4">
        <h2 className="text-lg font-black font-[family-name:var(--font-heading)] text-[#111111]">
          Regras da Partida
        </h2>

        <ToonInput
          label="Nome da Sala"
          name="roomName"
          placeholder="Nome da sua arena"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />

        {/* Senha (Opcional, apenas no Online) */}
        {selectedMode === 'online' && (
          <ToonInput
            label="Senha da Sala (Opcional)"
            type="password"
            placeholder="Deixe em branco para sala pública"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}

        {/* Vidas: Modo */}
        <Segmented
          label="Modo de Vidas"
          value={lifeMode}
          onChange={setLifeMode}
          options={[
            { label: 'Fixa', value: 'fixed' },
            { label: 'Aleatória', value: 'random' },
          ]}
        />

        {lifeMode === 'fixed' ? (
          <Stepper
            label="Quantidade de Vidas"
            value={lifeFixed}
            min={1}
            max={20}
            onChange={setLifeFixed}
          />
        ) : (
          <div className="flex flex-col gap-3 p-3 bg-[#F5F5F5] rounded-[14px] border-2 border-[#111111]">
            <Stepper
              label="Vida Mínima"
              value={lifeMin}
              min={1}
              max={lifeMax}
              onChange={(val) => setLifeMin(Math.min(val, lifeMax))}
            />
            <Stepper
              label="Vida Máxima"
              value={lifeMax}
              min={lifeMin}
              max={20}
              onChange={(val) => setLifeMax(Math.max(val, lifeMin))}
            />
            <Segmented
              label="Sorteio"
              value={lifeRandomScope}
              onChange={setLifeRandomScope}
              options={[
                { label: 'Todos Iguais', value: 'shared' },
                { label: 'Individual', value: 'individual' },
              ]}
            />
          </div>
        )}

        {/* Visibilidade de Vidas */}
        <Segmented
          label="Visibilidade das Vidas"
          value={lifeVisibility}
          onChange={setLifeVisibility}
          options={[
            { label: 'Visível', value: 'visible' },
            { label: 'Oculta', value: 'hidden' },
          ]}
        />

        {/* Papel do Organizador */}
        <Segmented
          label="Organizador"
          value={hostRole}
          onChange={handleHostRoleChange}
          options={[
            { label: 'Joga Junto', value: 'player' },
            { label: 'Espectador', value: 'spectator' },
          ]}
        />

        {/* Limite de Jogadores (Online) */}
        {selectedMode === 'online' && (
          <div className="flex flex-col gap-2">
            <Switch
              label="Limitar Quantidade de Jogadores"
              checked={isLimitedPlayers}
              onChange={setIsLimitedPlayers}
            />
            {isLimitedPlayers && (
              <Stepper
                label="Máximo de Jogadores"
                value={expectedPlayers}
                min={2}
                max={50}
                onChange={setExpectedPlayers}
              />
            )}
          </div>
        )}

        {/* Mostrar Quantidade de Golpes */}
        <Switch
          label="Mostrar Contagem de Golpes na Revelação"
          checked={showHitCount}
          onChange={setShowHitCount}
        />

        {/* Teto de Cartas Manual */}
        <div className="flex flex-col gap-2">
          <Switch
            label="Definir Teto Manual de Cartas por Rodada"
            checked={hasManualCap}
            onChange={setHasManualCap}
          />
          {hasManualCap && (
            <Stepper
              label="Teto de Cartas"
              value={maxCardsCap}
              min={1}
              max={20}
              onChange={setMaxCardsCap}
            />
          )}
        </div>
      </ToonCard>

      {/* Passo 3: Roster de Jogadores (Modo Singleplayer) */}
      {selectedMode === 'single' ? (
        <ToonCard padding="md" className="w-full flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black font-[family-name:var(--font-heading)] text-[#111111]">
              Jogadores ({players.length})
            </h2>
            <span className="text-[11px] text-[#666666] font-bold">Mínimo 2</span>
          </div>

          <div className="flex flex-col gap-2">
            {players.map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 bg-[#F5F5F5] rounded-[12px] border-2 border-[#111111]"
              >
                <div className="flex items-center gap-3">
                  <Avatar color={p.color} size="sm" isHost={idx === 0} />
                  <span className="font-bold text-sm text-[#111111]">{p.name}</span>
                  {idx === 0 && (
                    <span className="text-[10px] bg-[#FFC233] text-[#111111] border border-[#111111] px-1.5 py-0.5 rounded font-black">
                      HOST
                    </span>
                  )}
                </div>
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePlayer(p.id)}
                    className="text-xs font-black text-[#FF3038] hover:underline p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Adicionar Jogador Local */}
          <div className="pt-2 border-t-2 border-dashed border-[#111111] flex flex-col gap-3">
            <span className="text-xs font-black font-[family-name:var(--font-heading)] text-[#111111]">
              Adicionar Guerreiro
            </span>
            <ToonInput
              label="Nome do Jogador"
              placeholder="Ex: Coelho Bravo (vazio = aleatório)"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
            />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-[#111111]">Cor do Personagem</span>
              <ColorPicker
                selectedColor={newPlayerColor}
                onSelectColor={setNewPlayerColor}
                takenColors={players.map((p) => p.color)}
              />
            </div>
            <ToonButton
              variant="secondary"
              size="sm"
              onClick={handleAddPlayer}
              className="w-full mt-1"
            >
              + ADICIONAR JOGADOR
            </ToonButton>
          </div>
        </ToonCard>
      ) : (
        /* Explicação do Lobby Online */
        <ToonCard padding="md" className="w-full text-center space-y-2 bg-[#F5F5F5]">
          <span className="text-3xl">👑</span>
          <h3 className="font-cartoon text-lg text-black">Você será o Organizador (Host)</h3>
          <p className="text-xs text-gray-600 font-bold">
            Ao criar a arena online, um link e QR Code exclusivos serão gerados. Seus amigos poderão entrar instantaneamente de seus próprios celulares!
          </p>
        </ToonCard>
      )}

      {/* Botão de Criação */}
      <div className="w-full flex flex-col gap-2 pb-6">
        <ToonButton
          variant="primary"
          size="lg"
          disabled={isCreatingOnline || (selectedMode === 'single' && (hostRole === 'spectator' ? players.length - 1 : players.length) < 2)}
          onClick={handleCreateRoom}
          className="w-full py-3.5 text-lg"
        >
          {isCreatingOnline
            ? 'CRIANDO SALA ONLINE...'
            : selectedMode === 'online'
            ? 'CRIAR ARENA ONLINE! 🌐'
            : (hostRole === 'spectator' ? players.length - 1 : players.length) < 2
            ? `Faltam ${2 - (hostRole === 'spectator' ? players.length - 1 : players.length)} jogador(es) ativos`
            : 'INICIAR PARTIDA LOCAL! 🚀'}
        </ToonButton>
        <Link href="/" className="text-center">
          <span className="text-xs font-bold text-[#666666] hover:underline">
            Cancelar e voltar para o início
          </span>
        </Link>
      </div>
    </div>
  );
}
