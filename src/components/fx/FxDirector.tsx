'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Reveal, Player } from '@/lib/engine/types';
import { createRng } from '@/lib/engine/rng';
import { HIT_EFFECTS } from './hit';
import { DEATH_EFFECTS } from './death';

export interface FxQueueItem {
  id: string;
  type: 'hit' | 'death';
  playerId: string;
  playerName: string;
  playerColor: string;
  damage?: number | null;
  died: boolean;
  effectIndex: number;
}

export interface FxDirectorProps {
  reveal: Reveal | null;
  players: readonly Player[];
  showHitCount?: boolean;
  isTelao?: boolean;
  onFinish: () => void;
}

export const FxDirector: React.FC<FxDirectorProps> = ({
  reveal,
  players,
  showHitCount = true,
  isTelao = false,
  onFinish,
}) => {
  // Constrói a fila determinística de animações a partir da seed da revelação
  const queue: FxQueueItem[] = useMemo(() => {
    if (!reveal || !reveal.hits || reveal.hits.length === 0) {
      return [];
    }

    const rng = createRng(reveal.seed);
    const items: FxQueueItem[] = [];

    for (const hit of reveal.hits) {
      const player = players.find((p) => p.id === hit.playerId);
      const playerName = player ? player.name : 'Jogador';
      const playerColor = player ? player.color : '#35B8F4';

      // 1. Golpe (se tomou dano ou se showHitCount for false mas sabemos que foi atingido)
      if (hit.damage === null || hit.damage > 0 || hit.died) {
        const hitIdx = Math.floor(rng() * HIT_EFFECTS.length);
        items.push({
          id: `hit-${hit.playerId}-${reveal.round}`,
          type: 'hit',
          playerId: hit.playerId,
          playerName,
          playerColor,
          damage: showHitCount ? hit.damage : null,
          died: hit.died,
          effectIndex: hitIdx,
        });
      }

      // 2. Morte (se o jogador morreu nesta rodada)
      if (hit.died) {
        const deathIdx = Math.floor(rng() * DEATH_EFFECTS.length);
        items.push({
          id: `death-${hit.playerId}-${reveal.round}`,
          type: 'death',
          playerId: hit.playerId,
          playerName,
          playerColor,
          died: true,
          effectIndex: deathIdx,
        });
      }
    }

    return items;
  }, [reveal, players, showHitCount]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = useCallback(() => {
    if (currentIndex + 1 < queue.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onFinish();
    }
  }, [currentIndex, queue.length, onFinish]);

  // Se a fila estiver vazia (ninguém tomou dano na rodada)
  useEffect(() => {
    if (queue.length === 0) {
      const timer = setTimeout(() => {
        onFinish();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [queue.length, onFinish]);

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center gap-3">
        <span className="text-4xl">🛡️</span>
        <h3 className="text-2xl font-black font-[family-name:var(--font-heading)] text-[#111111]">
          Rodada Pacífica!
        </h3>
        <p className="text-sm font-semibold text-[#666666]">
          Ninguém tomou dano nesta rodada.
        </p>
      </div>
    );
  }

  const currentItem = queue[currentIndex];
  if (!currentItem) {
    return null;
  }

  // Renderiza o componente de golpe ou morte correspondente
  const renderCurrentEffect = () => {
    if (currentItem.type === 'hit') {
      const effectDef = HIT_EFFECTS[currentItem.effectIndex % HIT_EFFECTS.length];
      if (!effectDef) return null;
      const HitComponent = effectDef.component;
      return (
        <HitComponent
          key={currentItem.id}
          playerName={currentItem.playerName}
          playerColor={currentItem.playerColor}
          damage={currentItem.damage}
          seed={reveal?.seed}
          onDone={handleNext}
          isTelao={isTelao}
        />
      );
    } else {
      const deathDef = DEATH_EFFECTS[currentItem.effectIndex % DEATH_EFFECTS.length];
      if (!deathDef) return null;
      const DeathComponent = deathDef.component;
      return (
        <DeathComponent
          key={currentItem.id}
          playerName={currentItem.playerName}
          playerColor={currentItem.playerColor}
          seed={reveal?.seed}
          onDone={handleNext}
          isTelao={isTelao}
        />
      );
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center relative min-h-[320px]">
      {/* Barra de Progresso da Fila Toon */}
      <div className="w-full max-w-sm flex items-center justify-between px-4 py-2 bg-[#F5F5F5] rounded-[14px] border-2 border-[#111111] mb-2 text-xs font-bold font-[family-name:var(--font-heading)] select-none">
        <span className="text-[#111111]">
          Efeito {currentIndex + 1} de {queue.length}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleNext}
            className="text-xs font-black text-[#111111] bg-white px-2 py-0.5 rounded-[8px] border border-[#111111] hover:bg-[#FFC233] cursor-pointer"
          >
            Próximo ⏭
          </button>
          <button
            type="button"
            onClick={onFinish}
            className="text-xs font-black text-white bg-[#111111] px-2.5 py-0.5 rounded-[8px] border border-[#111111] hover:bg-[#FF3038] cursor-pointer"
          >
            Pular Tudo ⏩
          </button>
        </div>
      </div>

      {/* Palco do Efeito */}
      <div className="w-full flex items-center justify-center py-4">
        {renderCurrentEffect()}
      </div>
    </div>
  );
};
