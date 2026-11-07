import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMotionStore } from '@/lib/client/use-reduced-motion';
import { useAnnouncerStore, announce } from '@/lib/client/announcer';

describe('Acessibilidade: useReducedMotion e Announcer', () => {
  beforeEach(() => {
    localStorage.clear();
    useMotionStore.setState({ reducedMotion: false });
    useAnnouncerStore.setState({ message: '' });
  });

  it('useMotionStore inicializa com false e alterna para true salvando no localStorage', () => {
    expect(useMotionStore.getState().reducedMotion).toBe(false);

    useMotionStore.getState().toggleReducedMotion();
    expect(useMotionStore.getState().reducedMotion).toBe(true);
    expect(localStorage.getItem('arena_fdp_reduced_motion')).toBe('true');

    useMotionStore.getState().toggleReducedMotion();
    expect(useMotionStore.getState().reducedMotion).toBe(false);
    expect(localStorage.getItem('arena_fdp_reduced_motion')).toBe('false');
  });

  it('useMotionStore recupera preferência salva do localStorage no init()', () => {
    localStorage.setItem('arena_fdp_reduced_motion', 'true');
    useMotionStore.getState().init();
    expect(useMotionStore.getState().reducedMotion).toBe(true);
  });

  it('announce envia mensagem para o store do leitor de tela', async () => {
    vi.useFakeTimers();
    announce('Você tomou 2 de dano.');

    // O announcer limpa primeiro e define via timeout para re-engajar o leitor
    vi.advanceTimersByTime(60);

    expect(useAnnouncerStore.getState().message).toBe('Você tomou 2 de dano.');
    vi.useRealTimers();
  });
});
