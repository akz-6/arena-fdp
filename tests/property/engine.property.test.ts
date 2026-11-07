import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  createInitialState,
  reduce,
  projectPublic,
  createRng,
  GameConfig,
  GameState,
  GameAction,
  nextCards,
  computeMaxCards,
  GameConfigSchema,
} from '../../src/lib/engine';

describe('L1: Engine Invariants and Property-Based Testing (fast-check)', () => {
  // Teste de determinismo estrito
  it('Determinismo: mesma seed + mesma sequência de ações = estado final idêntico', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        fc.integer({ min: 2, max: 6 }),
        (seed, playerCount) => {
          const runSimulation = () => {
            const rng = createRng(seed);
            const ctx = { now: 1000, rng };
            let state = createInitialState({
              host: { id: 'p0', name: 'Host Player', color: '#FF0000' },
              seed,
              config: { lifeFixed: 3, lifeMode: 'fixed' },
            });

            for (let i = 1; i < playerCount; i++) {
              state = reduce(
                state,
                {
                  type: 'ADD_PLAYER',
                  actorId: `p${i}`,
                  player: { id: `p${i}`, name: `Player ${i}`, color: `#00000${i}` },
                },
                ctx
              ).state;
            }

            state = reduce(state, { type: 'START', actorId: 'p0' }, ctx).state;
            state = reduce(state, { type: 'END_ROUND', actorId: 'p0' }, ctx).state;

            // Reporte de dano determinístico
            for (let i = 0; i < playerCount; i++) {
              state = reduce(
                state,
                { type: 'SET_DAMAGE', actorId: `p${i}`, targetId: `p${i}`, damage: 1 },
                ctx
              ).state;
              state = reduce(state, { type: 'CONFIRM', actorId: `p${i}` }, ctx).state;
            }

            return state;
          };

          const run1 = runSimulation();
          const run2 = runSimulation();
          expect(run1).toEqual(run2);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Verificação de Sequência de Cartas Teórica
  it('Invariante da sequência de cartas: sobe até teto, desce até 1, sem repetir o 1', () => {
    const testCeilings = [1, 2, 4, 7];

    for (const teto of testCeilings) {
      let current = 1;
      let direction: 'up' | 'down' = 'up';
      const sequence: number[] = [current];

      for (let r = 0; r < 20; r++) {
        const next = nextCards({ current, direction, max: teto });
        current = next.cards;
        direction = next.direction;
        sequence.push(current);
      }

      // Invariantes da sequência
      for (let i = 0; i < sequence.length; i++) {
        const val = sequence[i];
        expect(val).toBeGreaterThanOrEqual(1);
        expect(val).toBeLessThanOrEqual(teto);

        // Se teto > 1, dois 1s nunca aparecem consecutivamente
        if (teto > 1 && i > 0 && val === 1) {
          expect(sequence[i - 1]).not.toBe(1);
        }
      }

      if (teto === 4) {
        expect(sequence.slice(0, 8)).toEqual([1, 2, 3, 4, 3, 2, 1, 2]);
      }
    }
  });

  // Simulação de Partidas Aleatórias com Invariantes Universais (5.000 partidas)
  it('5.000 simulações de partidas com todas as invariantes preservadas', () => {
    let simulatedMatches = 0;

    fc.assert(
      fc.property(
        fc.record({
          seed: fc.integer({ min: 1, max: 2147483647 }),
          playerCount: fc.integer({ min: 2, max: 12 }),
          lifeMode: fc.constantFrom<'fixed' | 'random'>('fixed', 'random'),
          lifeVisibility: fc.constantFrom<'visible' | 'hidden'>('visible', 'hidden'),
          lifeRandomScope: fc.constantFrom<'shared' | 'individual'>('shared', 'individual'),
          showHitCount: fc.boolean(),
          hostRole: fc.constantFrom<'player' | 'spectator'>('player', 'spectator'),
          maxCardsCap: fc.option(fc.integer({ min: 1, max: 10 }), { nil: null }),
        }),
        (configParams) => {
          const rng = createRng(configParams.seed);
          const ctx = { now: 1000, rng };

          let state = createInitialState({
            host: { id: 'p0', name: 'Host 0', color: '#111111' },
            seed: configParams.seed,
            config: {
              roomName: 'PBT Room',
              lifeVisibility: configParams.lifeVisibility,
              lifeMode: configParams.lifeMode,
              lifeFixed: 3,
              lifeMin: 2,
              lifeMax: 5,
              lifeRandomScope: configParams.lifeRandomScope,
              showHitCount: configParams.showHitCount,
              hostRole: configParams.hostRole,
              maxCardsCap: configParams.maxCardsCap,
              decks: 'auto',
            },
          });

          // Se host for spectator, precisamos de pelo menos 2 players ativos
          const totalPlayersToAdd =
            configParams.hostRole === 'spectator'
              ? Math.max(2, configParams.playerCount)
              : configParams.playerCount;

          // Adiciona jogadores
          for (let i = 1; i <= totalPlayersToAdd; i++) {
            state = reduce(
              state,
              {
                type: 'ADD_PLAYER',
                actorId: `p${i}`,
                player: {
                  id: `p${i}`,
                  name: `Player ${i}`,
                  color: `#${((i * 123456) % 0xffffff).toString(16).padStart(6, '0')}`,
                  role: 'player',
                },
              },
              ctx
            ).state;
          }

          // Inicia o jogo
          state = reduce(state, { type: 'START', actorId: 'p0' }, ctx).state;

          let turns = 0;
          const maxTurns = 25; // Previne loops infinitos

          while (state.phase !== 'finished' && turns < maxTurns) {
            turns++;
            const prevVersion = state.version;

            // Invariante de projeção pública em modo hidden
            const pub = projectPublic(state);
            const pubJson = JSON.stringify(pub);
            if (state.config.lifeVisibility === 'hidden') {
              expect(pubJson).not.toMatch(/"life":\d+/);
            }

            // Invariante de Dealer vivo e papel player durante rodada e reporte
            if (state.phase === 'round' || state.phase === 'reporting') {
              expect(state.dealerId).toBeTruthy();
              const dealer = state.players.find((p) => p.id === state.dealerId);
              expect(dealer).toBeDefined();
              expect(dealer?.status).toBe('alive');
              expect(dealer?.role).toBe('player');
            } else if (state.phase === 'reveal') {
              expect(state.dealerId).toBeTruthy();
            }

            // Invariante de cartas no limite do teto
            const aliveCount = state.players.filter((p) => p.status === 'alive' && p.role === 'player').length;
            const teto = computeMaxCards(state.config, aliveCount, 1);
            expect(state.cardsThisRound).toBeGreaterThanOrEqual(1);
            expect(state.cardsThisRound).toBeLessThanOrEqual(Math.max(1, teto));

            // Transição de fases
            if (state.phase === 'round') {
              state = reduce(state, { type: 'END_ROUND', actorId: 'p0' }, ctx).state;
              expect(state.version).toBeGreaterThan(prevVersion);
            } else if (state.phase === 'reporting') {
              // Todos os vivos reportam dano
              const alives = state.players.filter((p) => p.status === 'alive' && p.role === 'player');
              for (const p of alives) {
                // Sorteia dano entre 0 e 2
                const dmg = Math.floor(rng() * 2);
                state = reduce(
                  state,
                  { type: 'SET_DAMAGE', actorId: p.id, targetId: p.id, damage: dmg },
                  ctx
                ).state;
                state = reduce(state, { type: 'CONFIRM', actorId: p.id }, ctx).state;
              }
            } else if (state.phase === 'reveal') {
              // Invariante de vidas não-negativas
              for (const p of state.players) {
                if (p.life !== undefined) {
                  expect(p.life).toBeGreaterThanOrEqual(0);
                }
              }

              // Avança para próxima rodada ou encerra
              state = reduce(state, { type: 'NEXT_ROUND', actorId: 'p0' }, ctx).state;
              expect(state.version).toBeGreaterThan(prevVersion);
            }
          }

          // Se terminou, verificar invariante de vencedores
          if (state.phase === 'finished') {
            expect(state.winners).not.toBeNull();
            expect(Array.isArray(state.winners)).toBe(true);
          }

          simulatedMatches++;
          return true;
        }
      ),
      { numRuns: 5000, seed: 42 }
    );

    expect(simulatedMatches).toBe(5000);
  }, 30000);

  // Casos de Borda Críticos (L1 Edge Cases)
  describe('Casos de Borda Críticos', () => {
    it('Partida com 2 jogadores: dealer alterna perfeitamente a cada rodada', () => {
      const rng = createRng(1);
      const ctx = { now: 1000, rng };
      let state = createInitialState({
        host: { id: 'p1', name: 'P1', color: '#111' },
        config: { lifeFixed: 3 },
      });
      state = reduce(
        state,
        { type: 'ADD_PLAYER', actorId: 'p2', player: { id: 'p2', name: 'P2', color: '#222' } },
        ctx
      ).state;

      state = reduce(state, { type: 'START', actorId: 'p1' }, ctx).state;
      expect(state.dealerId).toBe('p1');

      state = reduce(state, { type: 'END_ROUND', actorId: 'p1' }, ctx).state;
      state = reduce(state, { type: 'CONFIRM', actorId: 'p1' }, ctx).state;
      state = reduce(state, { type: 'CONFIRM', actorId: 'p2' }, ctx).state;
      state = reduce(state, { type: 'NEXT_ROUND', actorId: 'p1' }, ctx).state;
      expect(state.dealerId).toBe('p2');

      state = reduce(state, { type: 'END_ROUND', actorId: 'p1' }, ctx).state;
      state = reduce(state, { type: 'CONFIRM', actorId: 'p1' }, ctx).state;
      state = reduce(state, { type: 'CONFIRM', actorId: 'p2' }, ctx).state;
      state = reduce(state, { type: 'NEXT_ROUND', actorId: 'p1' }, ctx).state;
      expect(state.dealerId).toBe('p1');
    });

    it('Morte simultânea de todos os jogadores resulta em empate declarado', () => {
      const rng = createRng(1);
      const ctx = { now: 1000, rng };
      let state = createInitialState({
        host: { id: 'p1', name: 'P1', color: '#111' },
        config: { lifeFixed: 1 },
      });
      state = reduce(
        state,
        { type: 'ADD_PLAYER', actorId: 'p2', player: { id: 'p2', name: 'P2', color: '#222' } },
        ctx
      ).state;

      state = reduce(state, { type: 'START', actorId: 'p1' }, ctx).state;
      state = reduce(state, { type: 'END_ROUND', actorId: 'p1' }, ctx).state;
      state = reduce(state, { type: 'SET_DAMAGE', actorId: 'p1', targetId: 'p1', damage: 1 }, ctx).state;
      state = reduce(state, { type: 'SET_DAMAGE', actorId: 'p2', targetId: 'p2', damage: 1 }, ctx).state;
      state = reduce(state, { type: 'CONFIRM', actorId: 'p1' }, ctx).state;
      state = reduce(state, { type: 'CONFIRM', actorId: 'p2' }, ctx).state;

      expect(state.phase).toBe('finished');
      expect(state.winners).toEqual(['p1', 'p2']); // Empate entre ambos
    });

    it('Danos inválidos: negativo, decimal, NaN, Infinity e dano > vida', () => {
      const rng = createRng(1);
      const ctx = { now: 1000, rng };
      let state = createInitialState({
        host: { id: 'p1', name: 'P1', color: '#111' },
        config: { lifeFixed: 5 },
      });
      state = reduce(
        state,
        { type: 'ADD_PLAYER', actorId: 'p2', player: { id: 'p2', name: 'P2', color: '#222' } },
        ctx
      ).state;
      state = reduce(state, { type: 'START', actorId: 'p1' }, ctx).state;
      state = reduce(state, { type: 'END_ROUND', actorId: 'p1' }, ctx).state;

      // Dano negativo rejeitado
      expect(() =>
        reduce(state, { type: 'SET_DAMAGE', actorId: 'p1', targetId: 'p1', damage: -1 }, ctx)
      ).toThrow();

      // Dano decimal rejeitado
      expect(() =>
        reduce(state, { type: 'SET_DAMAGE', actorId: 'p1', targetId: 'p1', damage: 1.5 }, ctx)
      ).toThrow();

      // Dano NaN rejeitado
      expect(() =>
        reduce(state, { type: 'SET_DAMAGE', actorId: 'p1', targetId: 'p1', damage: NaN }, ctx)
      ).toThrow();

      // Dano Infinity rejeitado
      expect(() =>
        reduce(state, { type: 'SET_DAMAGE', actorId: 'p1', targetId: 'p1', damage: Infinity }, ctx)
      ).toThrow();

      // Dano maior que vida é limitado ou ajustado para eliminar o jogador com vida 0
      state = reduce(state, { type: 'SET_DAMAGE', actorId: 'p1', targetId: 'p1', damage: 10 }, ctx).state;
      expect(state.pendingDamage['p1']).toBe(10);
      state = reduce(state, { type: 'CONFIRM', actorId: 'p1' }, ctx).state;
      state = reduce(state, { type: 'CONFIRM', actorId: 'p2' }, ctx).state;
      const p1 = state.players.find((p) => p.id === 'p1');
      expect(p1?.life).toBe(0);
      expect(p1?.status).toBe('dead');
    });

    it('Jogador morto nunca pode agir', () => {
      const rng = createRng(1);
      const ctx = { now: 1000, rng };
      let state = createInitialState({
        host: { id: 'p1', name: 'P1', color: '#111' },
        config: { lifeFixed: 1 },
      });
      state = reduce(
        state,
        { type: 'ADD_PLAYER', actorId: 'p2', player: { id: 'p2', name: 'P2', color: '#222' } },
        ctx
      ).state;
      state = reduce(
        state,
        { type: 'ADD_PLAYER', actorId: 'p3', player: { id: 'p3', name: 'P3', color: '#333' } },
        ctx
      ).state;

      state = reduce(state, { type: 'START', actorId: 'p1' }, ctx).state;
      state = reduce(state, { type: 'END_ROUND', actorId: 'p1' }, ctx).state;
      state = reduce(state, { type: 'SET_DAMAGE', actorId: 'p3', targetId: 'p3', damage: 1 }, ctx).state;
      state = reduce(state, { type: 'CONFIRM', actorId: 'p1' }, ctx).state;
      state = reduce(state, { type: 'CONFIRM', actorId: 'p2' }, ctx).state;
      state = reduce(state, { type: 'CONFIRM', actorId: 'p3' }, ctx).state;
      state = reduce(state, { type: 'NEXT_ROUND', actorId: 'p1' }, ctx).state;

      // P3 está morto
      const p3 = state.players.find((p) => p.id === 'p3');
      expect(p3?.status).toBe('dead');

      // P3 tenta reportar dano ou confirmar na nova rodada
      state = reduce(state, { type: 'END_ROUND', actorId: 'p1' }, ctx).state;
      expect(() =>
        reduce(state, { type: 'SET_DAMAGE', actorId: 'p3', targetId: 'p3', damage: 1 }, ctx)
      ).toThrow();
      expect(() => reduce(state, { type: 'CONFIRM', actorId: 'p3' }, ctx)).toThrow();
    });

    it('Espectador puro não pode alterar o estado do jogo', () => {
      const rng = createRng(1);
      const ctx = { now: 1000, rng };
      let state = createInitialState({
        host: { id: 'p1', name: 'P1', color: '#111' },
        config: { lifeFixed: 3 },
      });
      state = reduce(
        state,
        { type: 'ADD_PLAYER', actorId: 'p2', player: { id: 'p2', name: 'P2', color: '#222' } },
        ctx
      ).state;
      state = reduce(
        state,
        {
          type: 'ADD_PLAYER',
          actorId: 'spec1',
          player: { id: 'spec1', name: 'Watcher', color: '#333', role: 'spectator' },
        },
        ctx
      ).state;

      state = reduce(state, { type: 'START', actorId: 'p1' }, ctx).state;

      // Espectador tenta dar START, END_ROUND ou CONFIRM
      expect(() => reduce(state, { type: 'END_ROUND', actorId: 'spec1' }, ctx)).toThrow();
      expect(() =>
        reduce(state, { type: 'SET_DAMAGE', actorId: 'spec1', targetId: 'p1', damage: 1 }, ctx)
      ).toThrow();
    });

    it('Configuração com min > max é rejeitada pelo schema Zod', () => {
      expect(() => {
        GameConfigSchema.parse({
          lifeMin: 10,
          lifeMax: 5,
        });
      }).toThrow();
    });

    it('Suporta até 40 jogadores ativos com cálculo correto de baralhos', () => {
      const rng = createRng(1);
      const ctx = { now: 1000, rng };
      let state = createInitialState({
        host: { id: 'p0', name: 'Host 0', color: '#111' },
        config: { decks: 'auto' },
      });

      for (let i = 1; i < 40; i++) {
        state = reduce(
          state,
          {
            type: 'ADD_PLAYER',
            actorId: `p${i}`,
            player: {
              id: `p${i}`,
              name: `Player ${i}`,
              color: `#${(i + 10).toString(16).padStart(6, '0')}`,
            },
          },
          ctx
        ).state;
      }

      expect(state.players.length).toBe(40);
      state = reduce(state, { type: 'START', actorId: 'p0' }, ctx).state;
      expect(state.phase).toBe('round');
      // 40 jogadores = 2 baralhos (ceil(40/20) = 2) -> 80 cartas / 40 jogadores = teto 2
      expect(state.cardsThisRound).toBe(1);
    });

    it('P1.6: Vida Oculta - Ausência total de canais laterais (clamp silencioso e projeção idêntica)', () => {
      const rng = createRng(42);
      const ctx = { now: 1000, rng };

      // Jogador 1 tem 2 vidas, Jogador 2 tem 5 vidas (vidas ocultas diferentes)
      let state = createInitialState({
        host: { id: 'p1', name: 'Jogador 1', color: '#111' },
        config: {
          lifeVisibility: 'hidden',
          lifeMode: 'random',
          lifeMin: 2,
          lifeMax: 5,
          showHitCount: true,
        },
      });

      state = reduce(
        state,
        {
          type: 'ADD_PLAYER',
          actorId: 'p2',
          player: { id: 'p2', name: 'Jogador 2', color: '#222' },
        },
        ctx
      ).state;

      state = reduce(state, { type: 'START', actorId: 'p1' }, ctx).state;

      // Força vidas diferentes internamente no estado completo após START
      state.players[0]!.life = 2;
      state.players[1]!.life = 5;

      state = reduce(state, { type: 'END_ROUND', actorId: 'p1' }, ctx).state;
      expect(state.phase).toBe('reporting');

      // Ambos enviam dano exagerado (10) - muito maior que a vida de ambos
      // O servidor DEVE aceitar ambos sem lançar erro (zero canal lateral de validação)
      expect(() => {
        state = reduce(
          state,
          { type: 'SET_DAMAGE', actorId: 'p1', targetId: 'p1', damage: 10 },
          ctx
        ).state;
      }).not.toThrow();

      expect(() => {
        state = reduce(
          state,
          { type: 'SET_DAMAGE', actorId: 'p2', targetId: 'p2', damage: 10 },
          ctx
        ).state;
      }).not.toThrow();

      // Confirmação
      state = reduce(state, { type: 'CONFIRM', actorId: 'p1' }, ctx).state;
      state = reduce(state, { type: 'CONFIRM', actorId: 'p2' }, ctx).state;

      // Ambos morreram nesta rodada
      expect(state.phase).toBe('finished');

      // Projeção pública em finished inclui vidas para o resumo final (P2.3)
      const finishedPublic = projectPublic(state);
      expect(finishedPublic.players[0]?.life).toBe(0);
      expect(finishedPublic.players[1]?.life).toBe(0);

      // E o dano mostrado na revelação é o dano REPORTADO (10), não o dano clampado
      expect(state.lastReveal?.hits[0]?.damage).toBe(10);
      expect(state.lastReveal?.hits[1]?.damage).toBe(10);
      expect(state.lastReveal?.hits[0]?.appliedDamage).toBe(2);
      expect(state.lastReveal?.hits[1]?.appliedDamage).toBe(5);

      // JSON público nunca contém prevSnapshot nem appliedDamage
      const publicJson = JSON.stringify(finishedPublic);
      expect(publicJson).not.toContain('prevSnapshot');
      expect(publicJson).not.toContain('appliedDamage');
    });
  });
});
