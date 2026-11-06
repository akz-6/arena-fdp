export * from './GunShot';
export * from './RubberKnife';
export * from './ElasticPunch';
export * from './Anvil';
export * from './PieFace';
export * from './BonkHammer';
export * from './Dynamite';
export * from './FryingPan';
export * from './FallingPiano';

import { GunShot } from './GunShot';
import { RubberKnife } from './RubberKnife';
import { ElasticPunch } from './ElasticPunch';
import { Anvil } from './Anvil';
import { PieFace } from './PieFace';
import { BonkHammer } from './BonkHammer';
import { Dynamite } from './Dynamite';
import { FryingPan } from './FryingPan';
import { FallingPiano } from './FallingPiano';

export const HIT_EFFECTS = [
  { id: 'gun_shot', name: 'Tiro BANG!', component: GunShot },
  { id: 'rubber_knife', name: 'Faca de Borracha', component: RubberKnife },
  { id: 'elastic_punch', name: 'Murro Elástico', component: ElasticPunch },
  { id: 'anvil', name: 'Bigorna 100KG', component: Anvil },
  { id: 'pie_face', name: 'Torta na Cara', component: PieFace },
  { id: 'bonk_hammer', name: 'Marreta BONK', component: BonkHammer },
  { id: 'dynamite', name: 'Dinamite KABOOM', component: Dynamite },
  { id: 'frying_pan', name: 'Frigideira PANG', component: FryingPan },
  { id: 'falling_piano', name: 'Piano Caindo', component: FallingPiano },
] as const;

export type HitEffectId = typeof HIT_EFFECTS[number]['id'];
