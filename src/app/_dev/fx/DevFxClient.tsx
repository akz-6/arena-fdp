'use client';

import React, { useState } from 'react';
import {
  HIT_EFFECTS,
  DEATH_EFFECTS,
  VictoryFx,
  FxDirector,
  toonAudio,
  useShake,
} from '@/components/fx';
import { ToonButton, ToonCard, Switch } from '@/components/ui';
import { PLAYER_PALETTE } from '@/components/ui/ColorPicker';

export default function DevFxClient() {
  const { isEnabled: shakeEnabled, setIsEnabled: setShakeEnabled } = useShake();
  const [selectedColor, setSelectedColor] = useState('#35B8F4');
  const [activeEffect, setActiveEffect] = useState<{
    type: 'hit' | 'death' | 'victory' | 'tie' | 'director';
    id?: string;
  } | null>(null);

  const [soundEnabled, setSoundEnabled] = useState(!toonAudio.getIsMuted());
  const [isTelao, setIsTelao] = useState(false);

  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    toonAudio.setMuted(!enabled);
  };

  return (
    <div className="flex flex-col gap-6 pb-16">
      <div className="border-b-2 border-[#111111] pb-3">
        <h1 className="text-3xl font-black font-[family-name:var(--font-heading)] text-[#111111]">
          Catálogo de Efeitos Toon FX
        </h1>
        <p className="text-xs text-[#666666] font-bold uppercase tracking-wider mt-1">
          Página de teste de animações /_dev/fx (404 em produção)
        </p>
      </div>

      {/* Controles de Configuração e Teste */}
      <ToonCard padding="sm" className="flex flex-wrap items-center justify-between gap-4 bg-[#F5F5F5]">
        <div className="flex items-center gap-4">
          <Switch
            label="Sons Cartoon (WebAudio)"
            checked={soundEnabled}
            onChange={handleToggleSound}
          />
          <Switch
            label="Screen Shake"
            checked={shakeEnabled}
            onChange={setShakeEnabled}
          />
          <Switch
            label="Modo Telão"
            checked={isTelao}
            onChange={setIsTelao}
          />
        </div>

        {/* Seletor Rápido de Cor */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-[#111111]">Cor:</span>
          {PLAYER_PALETTE.slice(0, 6).map((c) => (
            <button
              key={c.hex}
              onClick={() => setSelectedColor(c.hex)}
              className={`w-6 h-6 rounded-full border border-[#111111] transition-transform ${
                selectedColor === c.hex ? 'scale-125 ring-2 ring-black' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </ToonCard>

      {/* Palco de Exibição Ativa */}
      <div className="min-h-[300px] flex items-center justify-center bg-white rounded-[20px] border-3 border-[#111111] shadow-[6px_6px_0px_#111111] p-4 relative overflow-hidden">
        {activeEffect ? (
          <div className="w-full flex flex-col items-center">
            {activeEffect.type === 'hit' && (() => {
              const effectDef = HIT_EFFECTS.find((e) => e.id === activeEffect.id);
              if (!effectDef) return null;
              const HitComp = effectDef.component;
              return (
                <HitComp
                  playerName="Pato Maluco"
                  playerColor={selectedColor}
                  damage={2}
                  onDone={() => setActiveEffect(null)}
                  isTelao={isTelao}
                />
              );
            })()}

            {activeEffect.type === 'death' && (() => {
              const effectDef = DEATH_EFFECTS.find((e) => e.id === activeEffect.id);
              if (!effectDef) return null;
              const DeathComp = effectDef.component;
              return (
                <DeathComp
                  playerName="Gato Ninja"
                  playerColor={selectedColor}
                  onDone={() => setActiveEffect(null)}
                  isTelao={isTelao}
                />
              );
            })()}

            {activeEffect.type === 'victory' && (
              <VictoryFx
                winnerName="Pato Campeão"
                winnerColor={selectedColor}
                onDone={() => setActiveEffect(null)}
                isTelao={isTelao}
              />
            )}

            {activeEffect.type === 'tie' && (
              <VictoryFx
                isTie
                tiedWinners={[
                  { name: 'Pato', color: '#FF3038' },
                  { name: 'Gato', color: '#35B8F4' },
                ]}
                onDone={() => setActiveEffect(null)}
                isTelao={isTelao}
              />
            )}

            {activeEffect.type === 'director' && (
              <FxDirector
                reveal={{
                  round: 3,
                  seed: 42,
                  hits: [
                    { playerId: 'p1', damage: 2, died: false },
                    { playerId: 'p2', damage: 4, died: true },
                  ],
                }}
                players={[
                  { id: 'p1', name: 'Pato', color: selectedColor, role: 'player', status: 'alive', joinOrder: 0 },
                  { id: 'p2', name: 'Gato', color: '#FFC233', role: 'player', status: 'dead', joinOrder: 1 },
                ]}
                onFinish={() => setActiveEffect(null)}
                isTelao={isTelao}
              />
            )}

            <button
              onClick={() => setActiveEffect(null)}
              className="mt-4 text-xs font-bold text-[#666666] hover:text-[#111111] underline cursor-pointer"
            >
              Parar Efeito
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center text-[#888888]">
            <span className="text-4xl mb-2">🎬</span>
            <p className="font-bold text-sm">Nenhum efeito ativo no momento.</p>
            <p className="text-xs">Clique em qualquer botão abaixo para disparar a animação!</p>
          </div>
        )}
      </div>

      {/* 1. Catálogo dos 9 Golpes */}
      <section className="flex flex-col gap-2">
        <h3 className="text-lg font-black font-[family-name:var(--font-heading)] text-[#111111]">
          💥 9 Golpes Cartoon
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {HIT_EFFECTS.map((fx) => (
            <ToonButton
              key={fx.id}
              variant="secondary"
              size="sm"
              onClick={() => setActiveEffect({ type: 'hit', id: fx.id })}
            >
              {fx.name}
            </ToonButton>
          ))}
        </div>
      </section>

      {/* 2. Catálogo das 6 Mortes */}
      <section className="flex flex-col gap-2">
        <h3 className="text-lg font-black font-[family-name:var(--font-heading)] text-[#111111]">
          💀 6 Mortes Cartoon
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {DEATH_EFFECTS.map((fx) => (
            <ToonButton
              key={fx.id}
              variant="danger"
              size="sm"
              onClick={() => setActiveEffect({ type: 'death', id: fx.id })}
            >
              {fx.name}
            </ToonButton>
          ))}
        </div>
      </section>

      {/* 3. Fim de Jogo & FxDirector */}
      <section className="flex flex-col gap-2">
        <h3 className="text-lg font-black font-[family-name:var(--font-heading)] text-[#111111]">
          🏆 Vitória, Empate e FxDirector
        </h3>
        <div className="flex flex-wrap gap-2.5">
          <ToonButton
            variant="yellow"
            size="md"
            onClick={() => setActiveEffect({ type: 'victory' })}
          >
            👑 Tela de Vitória
          </ToonButton>
          <ToonButton
            variant="secondary"
            size="md"
            onClick={() => setActiveEffect({ type: 'tie' })}
          >
            🤝 Tela de Empate
          </ToonButton>
          <ToonButton
            variant="primary"
            size="md"
            onClick={() => setActiveEffect({ type: 'director' })}
          >
            🎬 Simulação FxDirector (Fila Completa)
          </ToonButton>
        </div>
      </section>
    </div>
  );
}
