import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VictoryFx } from '../VictoryFx';
import { FxDirector } from '../FxDirector';
import { HIT_EFFECTS } from '../hit';
import { DEATH_EFFECTS } from '../death';
import { toonAudio } from '../utils/sound';

describe('Toon FX: Efeitos Individuais', () => {
  it('renderiza todos os 9 golpes sem quebrar', () => {
    for (const fx of HIT_EFFECTS) {
      const Comp = fx.component;
      const { unmount } = render(
        <Comp playerName="Jogador Teste" playerColor="#FF3038" damage={2} onDone={vi.fn()} />
      );
      expect(screen.getByText('Jogador Teste')).toBeInTheDocument();
      unmount();
    }
  });

  it('renderiza todas as 6 mortes sem quebrar', () => {
    for (const fx of DEATH_EFFECTS) {
      const Comp = fx.component;
      const { unmount } = render(
        <Comp playerName="Alvo Morto" playerColor="#35B8F4" onDone={vi.fn()} />
      );
      expect(screen.getAllByText(/Alvo Morto/i).length).toBeGreaterThan(0);
      unmount();
    }
  });

  it('renderiza tela de vitória com campeão', () => {
    render(<VictoryFx winnerName="Mestre FDP" winnerColor="#FFC233" onDone={vi.fn()} />);
    expect(screen.getByText('Mestre FDP')).toBeInTheDocument();
    expect(screen.getByText(/CAMPEÃO DA ARENA!/i)).toBeInTheDocument();
  });

  it('renderiza tela de empate com múltiplos vencedores', () => {
    render(
      <VictoryFx
        isTie
        tiedWinners={[
          { name: 'Pato', color: '#FF3038' },
          { name: 'Gato', color: '#35B8F4' },
        ]}
      />
    );
    expect(screen.getByText(/EMPATE! TODOS CAÍRAM JUNTOS!/i)).toBeInTheDocument();
    expect(screen.getByText('Pato')).toBeInTheDocument();
    expect(screen.getByText('Gato')).toBeInTheDocument();
  });
});

describe('Toon FX: FxDirector', () => {
  it('executa a fila de efeitos e permite pular tudo', () => {
    const handleFinish = vi.fn();
    render(
      <FxDirector
        reveal={{
          round: 1,
          seed: 42,
          hits: [
            { playerId: 'p1', damage: 3, died: false },
            { playerId: 'p2', damage: 5, died: true },
          ],
        }}
        players={[
          { id: 'p1', name: 'Pato', color: '#FF3038', role: 'player', status: 'alive', joinOrder: 0 },
          { id: 'p2', name: 'Gato', color: '#35B8F4', role: 'player', status: 'dead', joinOrder: 1 },
        ]}
        onFinish={handleFinish}
      />
    );

    expect(screen.getByText(/Efeito 1 de/i)).toBeInTheDocument();

    const skipAllBtn = screen.getByRole('button', { name: /Pular Tudo/i });
    fireEvent.click(skipAllBtn);

    expect(handleFinish).toHaveBeenCalledTimes(1);
  });

  it('chama onFinish se a rodada for pacífica (sem danos)', () => {
    vi.useFakeTimers();
    const handleFinish = vi.fn();
    render(<FxDirector reveal={{ round: 1, seed: 10, hits: [] }} players={[]} onFinish={handleFinish} />);

    expect(screen.getByText(/Rodada Pacífica!/i)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(handleFinish).toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe('Toon FX: Áudio Sintetizado WebAudio', () => {
  it('permite mutar e desmutar sons', () => {
    toonAudio.setMuted(false);
    expect(toonAudio.getIsMuted()).toBe(false);

    // Disparos seguros sem erro
    toonAudio.playBonk();
    toonAudio.playExplosion();
    toonAudio.playSlideDown();
    toonAudio.playVictory();

    toonAudio.setMuted(true);
    expect(toonAudio.getIsMuted()).toBe(true);
  });
});
