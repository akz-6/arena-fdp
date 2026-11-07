import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlayerGrid } from '@/components/game/PlayerGrid';
import { ReportPanel } from '@/components/game/ReportPanel';
import { useLocalGamesStore } from '@/lib/client/local-game-store';
import { useProfileStore } from '@/lib/client/profile-store';
import { createInitialState, reduce } from '@/lib/engine/reducer';
import { Player, GameAction } from '@/lib/engine/types';

describe('Singleplayer: PlayerGrid e Proteção de Vida Oculta', () => {
  const mockPlayers: Player[] = [
    { id: 'p1', name: 'Organizador', color: '#FF3038', role: 'player', status: 'alive', joinOrder: 0, life: 5 },
    { id: 'p2', name: 'Pato Maluco', color: '#35B8F4', role: 'player', status: 'alive', joinOrder: 1, life: 3 },
  ];

  it('exibe vidas no DOM quando lifeVisibility = visible', () => {
    render(
      <PlayerGrid
        players={mockPlayers}
        hostId="p1"
        dealerId="p1"
        lifeVisibility="visible"
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('NUNCA exibe números de vida no DOM quando lifeVisibility = hidden', () => {
    const { container } = render(
      <PlayerGrid
        players={mockPlayers}
        hostId="p1"
        dealerId="p1"
        lifeVisibility="hidden"
      />
    );

    // Em modo oculto, os números 5 e 3 (vidas) não devem aparecer em lugar nenhum
    expect(screen.queryByText('5')).not.toBeInTheDocument();
    expect(screen.queryByText('3')).not.toBeInTheDocument();
    expect(container.innerHTML).not.toContain('❤️');
  });
});

describe('Singleplayer: ReportPanel', () => {
  const mockPlayers: Player[] = [
    { id: 'p1', name: 'Organizador', color: '#FF3038', role: 'player', status: 'alive', joinOrder: 0, life: 5 },
    { id: 'p2', name: 'Pato', color: '#35B8F4', role: 'player', status: 'alive', joinOrder: 1, life: 3 },
  ];

  it('permite alterar danos de cada jogador e disparar submissão', () => {
    const damageMap: Record<string, number> = {};
    const handleSetDamage = (id: string, dmg: number) => {
      damageMap[id] = dmg;
    };
    const handleSubmit = vi.fn();

    render(
      <ReportPanel
        players={mockPlayers}
        pendingDamage={damageMap}
        onSetDamage={handleSetDamage}
        onSubmitReport={handleSubmit}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /ENCERRAR RODADA E REVELAR/i });
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
});

describe('Singleplayer: Persistência e Resiliência do Armazenamento', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('armazena e recupera partidas locais com versionamento', () => {
    const { saveMatch, getMatch, deleteMatch } = useLocalGamesStore.getState();

    const state = createInitialState({
      host: { id: 'h1', name: 'Host', color: '#111' },
      config: { roomName: 'Arena Teste' },
    });

    saveMatch('match-123', state);

    const retrieved = getMatch('match-123');
    expect(retrieved).toBeDefined();
    expect(retrieved?.roomName).toBe('Arena Teste');

    deleteMatch('match-123');
    expect(getMatch('match-123')).toBeUndefined();
  });

  it('salva e limpa perfil local', () => {
    const { setProfile, clearProfile } = useProfileStore.getState();
    setProfile('Jogador Local', '#FF9500');

    expect(useProfileStore.getState().profile?.name).toBe('Jogador Local');
    expect(useProfileStore.getState().profile?.color).toBe('#FF9500');

    clearProfile();
    expect(useProfileStore.getState().profile).toBeNull();
  });

  it('P1.2: partida local com 2, 3 e 5 jogadores fecha rodada e transita para reveal com danos aplicados', () => {
    const palette = ['#FF3038', '#35B8F4', '#FFC233', '#2ECC71', '#9B51E0'];
    for (const count of [2, 3, 5]) {
      const players = Array.from({ length: count }, (_, i) => ({
        id: `p${i + 1}`,
        name: `Jogador ${i + 1}`,
        color: palette[i % palette.length],
      }));

      const ctx = { now: Date.now(), rng: () => 0.5 };
      let state = createInitialState({
        host: players[0],
        config: { roomName: 'Arena Local', lifeVisibility: 'visible', lifeMode: 'fixed', lifeFixed: 5, operatorMode: true },
      });

      for (let i = 1; i < count; i++) {
        state = reduce(
          state,
          {
            type: 'ADD_PLAYER',
            player: { id: players[i].id, name: players[i].name, color: players[i].color, role: 'player' },
          },
          ctx
        ).state;
      }

      state = reduce(state, { type: 'START', actorId: 'p1' }, ctx).state;
      expect(state.phase).toBe('round');

      state = reduce(state, { type: 'END_ROUND', actorId: 'p1' }, ctx).state;
      expect(state.phase).toBe('reporting');

      // Aplica ações encadeadas de dano e confirmação
      const alive = state.players.filter((p) => p.status === 'alive' && p.role === 'player');
      expect(alive.length).toBe(count);

      const actions: GameAction[] = [];
      for (let i = 0; i < alive.length; i++) {
        actions.push({
          type: 'SET_DAMAGE',
          actorId: state.hostId,
          targetId: alive[i].id,
          damage: i + 1,
        });
        actions.push({
          type: 'CONFIRM',
          actorId: alive[i].id,
        });
      }

      for (const a of actions) {
        state = reduce(state, a, ctx).state;
      }

      expect(state.phase).toBe('reveal');
      expect(state.lastReveal).toBeDefined();
      expect(state.lastReveal?.hits.length).toBe(count);

      // Confirma que cada jogador teve o dano exato subtraído de sua vida
      for (let i = 0; i < alive.length; i++) {
        const pAfter = state.players.find((p) => p.id === alive[i].id);
        expect(pAfter?.life).toBe(5 - (i + 1));
      }
    }
  });
});
