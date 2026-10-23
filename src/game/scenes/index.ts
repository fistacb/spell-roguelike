import type { Rng, SceneDef } from '../scene';
import { barn } from './barn';
import { bear } from './bear';
import { crows } from './crows';
import { ferry } from './ferry';
import { fog } from './fog';
import { imp } from './imp';
import { REGIONS, type RegionId } from './regions';
import { rockfall } from './rockfall';
import { slime } from './slime';
import { wolves } from './wolves';

export const SCENES: Record<string, SceneDef> = Object.fromEntries(
  [rockfall, imp, wolves, barn, bear, slime, crows, ferry, fog].map((s) => [s.id, s]),
);

export const STAGE_COUNT = 3;
// 場面の候補が増えるまでは1ステージ3場面にしておく（目標は5場面）
export const STAGE_LENGTH = 3;

// 続けて起きる1組。最初のステージで必ず起きる
const OPENING = ['rockfall', 'imp'];

function shuffle<T>(items: T[], rng: Rng): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1)) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 1つのステージの場面を決める。
 * その地域の場面を優先し、足りない分はまだ起きていない他の場面から選ぶ。
 * 故郷では「女の子と落石」→「いたずら小鬼」の1組が必ず入る。
 */
export function buildStage(region: RegionId, used: string[], rng: Rng): string[] {
  const free = (id: string) => !used.includes(id) && !OPENING.includes(id);
  const local = shuffle(REGIONS[region].scenes.filter(free), rng);
  const others = shuffle(Object.keys(SCENES).filter((id) => free(id) && !local.includes(id)), rng);
  if (region === 'home') {
    const rest = [...local, ...others].slice(0, STAGE_LENGTH - OPENING.length);
    return shuffle([OPENING, ...rest.map((id) => [id])], rng).flat();
  }
  return [...local, ...others].slice(0, STAGE_LENGTH);
}
