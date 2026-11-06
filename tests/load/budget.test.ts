// @vitest-environment node
import { describe, it, expect } from 'vitest';

describe('L7: Load Test Capacity Planning & Realtime Budget Model', () => {
  const FREE_TIER_LIMITS = {
    maxConnections: 200,
    maxMessagesPerSec: 100,
    maxJoinsPerSec: 100,
    maxPayloadKb: 256,
  };

  const SAFETY_FACTOR = 0.6; // 60% ceiling conforme Regra S3

  const BUDGET = {
    safeConnections: Math.floor(FREE_TIER_LIMITS.maxConnections * SAFETY_FACTOR), // 120
    safeMessagesPerSec: Math.floor(FREE_TIER_LIMITS.maxMessagesPerSec * SAFETY_FACTOR), // 60
    safeJoinsPerSec: Math.floor(FREE_TIER_LIMITS.maxJoinsPerSec * SAFETY_FACTOR), // 60
  };

  it('Calcula limites de segurança em 60% do plano gratuito', () => {
    expect(BUDGET.safeConnections).toBe(120);
    expect(BUDGET.safeMessagesPerSec).toBe(60);
    expect(BUDGET.safeJoinsPerSec).toBe(60);
  });

  it('Fórmula de Fan-Out: msg/s = ações/s * jogadores/sala não excede o teto de 60 msg/s', () => {
    // Cenário 1: 10 jogadores em 1 sala
    const playersPerRoom = 10;
    const maxActionsPerSec = BUDGET.safeMessagesPerSec / playersPerRoom;
    expect(maxActionsPerSec).toBe(6); // Máximo 6 ações/segundo para 1 sala com 10 jogadores

    // Cenário 2: 12 salas simultâneas com 4 jogadores cada (48 jogadores conectados)
    const activeRooms = 12;
    const players = 4;
    const actionsPerRoomPerSec = 0.5; // 1 ação a cada 2 segundos por sala
    const totalMessagesPerSec = activeRooms * actionsPerRoomPerSec * players; // 12 * 0.5 * 4 = 24 msg/s

    expect(totalMessagesPerSec).toBeLessThanOrEqual(BUDGET.safeMessagesPerSec);
    expect(activeRooms * players).toBeLessThanOrEqual(BUDGET.safeConnections);
  });
});
