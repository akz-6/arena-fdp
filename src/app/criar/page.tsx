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
  const [selectedMode, setSelectedMode] = useState<'single' | 'online'>('single');

  // Passo 2: Configuração da Partida
  const [roomName, setRoomName] = useState('Arena FDP');
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

  // Cadastro de Jogadores do Lobby Local
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

  // Novo jogador formulário
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

  const handleCreateRoom = () => {
    if (players.length < 2) {
      showToast('Adicione pelo menos 2 jogadores para iniciar!', 'error');
      return;
    }

    const hostPlayer = players[0];
    if (!hostPlayer) return;

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
      expectedPlayers: null,
      maxCardsCap: hasManualCap ? maxCardsCap : null,
      decks: 'auto',
      operatorMode: true, // Organizador opera tudo no Singleplayer
    };

    const roomId = `local-${Date.now().toString(36)}`;
    const seed = Date.now();
    const ctx = { now: Date.now(), rng: createRng(seed) };

    // 1. Cria estado com o Host
    let state = createInitialState({
      host: {
        id: hostPlayer.id,
        name: hostPlayer.name,
        color: hostPlayer.color,
      },
      config: gameConfig,
      seed,
    });

    // 2. Adiciona os demais jogadores
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

    // 3. Salva no armazenamento local
    saveMatch(roomId, state);
    showToast('Partida criada com sucesso!', 'success');

    // 4. Redireciona para a partida
    router.push(`/local/${roomId}`);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start py-4 max-w-md mx-auto w-full gap-5">
      <div className="w-full text-center">
        <h1 className="text-3xl font-black font-[family-name:var(--font-heading)] text-[#111111]">
          Criar Sala
        </h1>
        <p className="text-xs text-[#666666] font-semibold mt-1">
          Configure a partida física e os jogadores
        </p>
      </div>

      {/* Passo 1: Modo de Jogo */}
      <ToonCard padding="sm" className="w-full">
        <div className="grid grid-cols-2 gap-2">
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

          <button
            type="button"
            onClick={() => {
              showToast('O modo Online será liberado nas Fases 5 e 6!', 'info');
            }}
            className="p-3 rounded-[12px] border-2 border-[#111111] font-bold font-[family-name:var(--font-heading)] flex flex-col items-center text-center gap-1 opacity-70 bg-[#F5F5F5] cursor-not-allowed relative"
          >
            <span className="text-2xl">🌐</span>
            <span className="text-sm text-[#111111]">Online (Em Breve)</span>
            <span className="text-[10px] text-[#666666]">Multiplayer com link e QR</span>
            <span className="absolute top-1 right-1 bg-[#8E5CF7] text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
              Fase 6
            </span>
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
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />

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
            <div className="grid grid-cols-2 gap-2">
              <Stepper
                label="Vida Mínima"
                value={lifeMin}
                min={1}
                max={lifeMax}
                onChange={setLifeMin}
              />
              <Stepper
                label="Vida Máxima"
                value={lifeMax}
                min={lifeMin}
                max={20}
                onChange={setLifeMax}
              />
            </div>
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

        {/* Visibilidade das Vidas */}
        <Segmented
          label="Visibilidade das Vidas"
          value={lifeVisibility}
          onChange={setLifeVisibility}
          options={[
            { label: '👁️ Visível', value: 'visible' },
            { label: '🕵️ Oculta', value: 'hidden' },
          ]}
        />

        {/* Papel do Organizador */}
        <Segmented
          label="Organizador"
          value={hostRole}
          onChange={setHostRole}
          options={[
            { label: '🃏 Joga Junto', value: 'player' },
            { label: '👀 Só Marca Pontos', value: 'spectator' },
          ]}
        />

        {/* Mostrar Golpes na Revelação */}
        <Switch
          label="Mostrar Golpes na Revelação"
          description="Dramatiza danos com animações cartoon"
          checked={showHitCount}
          onChange={setShowHitCount}
        />

        {/* Teto de Cartas */}
        <Switch
          label="Teto Manual de Cartas"
          description={hasManualCap ? 'Teto limitado' : 'Auto (calculado por rodada)'}
          checked={hasManualCap}
          onChange={setHasManualCap}
        />

        {hasManualCap && (
          <Stepper
            label="Máximo de Cartas por Rodada"
            value={maxCardsCap}
            min={2}
            max={20}
            onChange={setMaxCardsCap}
          />
        )}
      </ToonCard>

      {/* Passo 3: Cadastro de Jogadores no Lobby */}
      <ToonCard padding="md" className="w-full flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black font-[family-name:var(--font-heading)] text-[#111111]">
            Jogadores ({players.length})
          </h2>
          <span className="text-xs font-bold text-[#666666]">Mínimo 2</span>
        </div>

        {/* Lista de Jogadores Cadastrados */}
        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
          {players.map((p, index) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-2.5 bg-[#F9F9F9] rounded-[12px] border-2 border-[#111111] shadow-[2px_2px_0px_#111111]"
            >
              <div className="flex items-center gap-2.5">
                <Avatar color={p.color} size="sm" isHost={index === 0} />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[#111111] font-[family-name:var(--font-heading)]">
                    {p.name}
                  </span>
                  {index === 0 && (
                    <span className="text-[10px] font-bold text-[#FF9500]">👑 Organizador</span>
                  )}
                </div>
              </div>

              {index > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemovePlayer(p.id)}
                  aria-label={`Remover ${p.name}`}
                  className="w-8 h-8 rounded-full bg-white hover:bg-[#FF3038] hover:text-white border-2 border-[#111111] flex items-center justify-center font-bold text-xs cursor-pointer transition-all"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Adicionar Novo Jogador */}
        <div className="flex flex-col gap-3 p-3 bg-[#F5F5F5] rounded-[14px] border-2 border-[#111111]">
          <span className="text-xs font-bold text-[#111111] font-[family-name:var(--font-heading)]">
            + Adicionar Jogador
          </span>
          <div className="flex gap-2">
            <ToonInput
              placeholder="Nome (ou vazio para sorteio)"
              value={newPlayerName}
              maxLength={16}
              onChange={(e) => setNewPlayerName(e.target.value)}
            />
            <ToonButton
              type="button"
              variant="yellow"
              size="sm"
              onClick={handleAddPlayer}
              className="shrink-0"
            >
              + Adicionar
            </ToonButton>
          </div>

          <ColorPicker
            selectedColor={newPlayerColor}
            takenColors={players.map((p) => p.color)}
            onSelectColor={setNewPlayerColor}
          />
        </div>
      </ToonCard>

      {/* Botão de Criação */}
      <ToonButton
        variant="primary"
        size="lg"
        fullWidth
        onClick={handleCreateRoom}
        className="text-xl shadow-[5px_5px_0px_#111111]"
      >
        🚀 INICIAR PARTIDA
      </ToonButton>

      <Link href="/" className="w-full">
        <ToonButton variant="secondary" size="md" fullWidth>
          ⬅ Voltar para o Início
        </ToonButton>
      </Link>
    </div>
  );
}
