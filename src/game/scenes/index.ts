import type { Rng, SceneDef } from '../scene';
import { barn } from './barn';
import { bear } from './bear';
import { imp } from './imp';
import { rockfall } from './rockfall';
import { slime } from './slime';
import { wolves } from './wolves';

export const SCENES: Record<string, SceneDef> = Object.fromEntries(
  [rockfall, imp, wolves, barn, bear, slime].map((s) => [s.id, s]),
);

export const JOURNEY_LENGTH = 5;

function shuffle<T>(items: T[], rng: Rng): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1)) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 1回の旅の場面を決める。
 * 「女の子と落石」と「いたずら小鬼」は続けて起きる1組として必ず入り、
 * 残りは他の候補からランダムに選んで、順番もランダムにする。
 */
export function buildJourney(rng: Rng): string[] {
  const others = shuffle(['wolves', 'barn', 'bear', 'slime'], rng).slice(0, JOURNEY_LENGTH - 2);
  const units: string[][] = shuffle([['rockfall', 'imp'], ...others.map((id) => [id])], rng);
  return units.flat();
}
