'use client';

import React from 'react';
import { Player } from '@/lib/engine/types';
import { Stepper, ToonButton } from '@/components/ui';
import { Avatar } from '@/components/toon/Avatar';

export interface ReportPanelProps {
  players: readonly Player[];
  pendingDamage: Record<string, number>;
  onSetDamage: (playerId: string, damage: number) => void;
  onSubmitReport: () => void;
  disabled?: boolean;
}

export const ReportPanel: React.FC<ReportPanelProps> = ({
  players,
  pendingDamage,
  onSetDamage,
  onSubmitReport,
  disabled = false,
}) => {
  const alivePlayers = players.filter((p) => p.status === 'alive' && p.role === 'player');

  return (
    <div className="w-full bg-white rounded-[20px] border-3 border-[#111111] shadow-[5px_5px_0px_#111111] p-4 sm:p-5 flex flex-col gap-4">
      <div className="border-b-2 border-[#111111] pb-2 text-center">
        <h3 className="text-xl font-black font-[family-name:var(--font-heading)] text-[#111111]">
          Reporte de Danos da Rodada
        </h3>
        <p className="text-xs text-[#666666] font-semibold mt-0.5">
          Quantos golpes cada jogador sofreu nesta rodada?
        </p>
      </div>

      {/* Lista de Steppers por Jogador Vivo */}
      <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
        {alivePlayers.map((player) => {
          const damage = pendingDamage[player.id] ?? 0;

          return (
            <div
              key={player.id}
              className="flex items-center justify-between p-2.5 bg-[#F9F9F9] rounded-[14px] border-2 border-[#111111] shadow-[2px_2px_0px_#111111]"
            >
              <div className="flex items-center gap-3">
                <Avatar color={player.color} size="sm" />
                <span className="font-bold text-sm text-[#111111] font-[family-name:var(--font-heading)]">
                  {player.name}
                </span>
              </div>

              <Stepper
                value={damage}
                min={0}
                max={20}
                onChange={(newDamage) => onSetDamage(player.id, newDamage)}
                disabled={disabled}
              />
            </div>
          );
        })}
      </div>

      {/* Botão de Conclusão */}
      <ToonButton
        variant="primary"
        size="lg"
        fullWidth
        onClick={onSubmitReport}
        disabled={disabled}
        className="mt-1 shadow-[4px_4px_0px_#111111]"
      >
        💥 ENCERRAR RODADA E REVELAR
      </ToonButton>
    </div>
  );
};
