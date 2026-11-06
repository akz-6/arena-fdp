import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlayerGrid } from '@/components/game/PlayerGrid';
import { ReportPanel } from '@/components/game/ReportPanel';
import { useLocalGamesStore } from '@/lib/client/local-game-store';
import { useProfileStore } from '@/lib/client/profile-store';
import { createInitialState } from '@/lib/engine/reducer';
import { Player } from '@/lib/engine/types';

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
});
