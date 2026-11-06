/**
 * Arena FDP — Cenário de Teste de Carga k6
 *
 * Respeita a Regra S3 (Orçamento de Realtime Supabase Free):
 * - Limite Free: 200 conexões, 100 msg/s, 100 joins/s
 * - Teto de Segurança (60%): 120 conexões, 60 msg/s, 60 joins/s
 * - Fórmula Fan-Out: msg/s = ações/s * jogadores/sala
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Rampa de subida leve: 20 VUs
    { duration: '1m', target: 50 },  // Carga moderada: 50 VUs (dentro dos 60% de conexões)
    { duration: '30s', target: 0 },   // Desaceleração graciosa
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% das requisições abaixo de 500ms
    http_req_failed: ['rate<0.01'],    // Menos de 1% de falhas
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // 1. Criar sala
  const createPayload = JSON.stringify({
    config: {
      roomName: 'K6 Arena Load',
      lifeVisibility: 'visible',
      lifeFixed: 5,
    },
    hostProfile: {
      name: `HostK6_${__VU}`,
      color: '#FF3038',
    },
  });

  const createRes = http.post(`${BASE_URL}/api/rooms`, createPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  const createOk = check(createRes, {
    'sala criada com sucesso (201)': (r) => r.status === 201,
  });

  if (!createOk) {
    sleep(1);
    return;
  }

  const room = JSON.parse(createRes.body);
  const code = room.code;
  const token = room.token;

  // 2. Consulta de estado pública (polling/reconciliação simulada)
  const stateRes = http.get(`${BASE_URL}/api/rooms/${code}/state`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  check(stateRes, {
    'estado carregado com sucesso (200)': (r) => r.status === 200,
  });

  // Pausa com jitter para simular comportamento humano e evitar picos de fan-out
  sleep(1 + Math.random());
}
