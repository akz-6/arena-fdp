export * from './GhostAscend';
export * from './PancakeCrumble';
export * from './HoleFall';
export * from './SpiralSpin';
export * from './Tombstone';
export * from './IrisOutDeath';

import { GhostAscend } from './GhostAscend';
import { PancakeCrumble } from './PancakeCrumble';
import { HoleFall } from './HoleFall';
import { SpiralSpin } from './SpiralSpin';
import { Tombstone } from './Tombstone';
import { IrisOutDeath } from './IrisOutDeath';

export const DEATH_EFFECTS = [
  { id: 'ghost_ascend', name: 'Fantasminha e Harpa', component: GhostAscend },
  { id: 'pancake_crumble', name: 'Achatado em Pedaços', component: PancakeCrumble },
  { id: 'hole_fall', name: 'Buraco no Chão', component: HoleFall },
  { id: 'spiral_spin', name: 'Giro em Espiral', component: SpiralSpin },
  { id: 'tombstone', name: 'Lápide R.I.P.', component: Tombstone },
  { id: 'iris_out', name: 'Íris Circular FIM!', component: IrisOutDeath },
] as const;

export type DeathEffectId = typeof DEATH_EFFECTS[number]['id'];
