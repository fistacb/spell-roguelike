// 言葉の使い道表：すべての場面で言葉を総当たりで唱え、その言葉を抜いた呪文と比べて
// 「効いたかどうか」を数える。言葉を足したときに、使い道のない言葉や効きすぎる言葉を見つけるための開発用の道具

import { parseSpell } from './parse';
import type { Outcome, Rng, SceneDef } from './scene';
import { buildStage, SCENES, STAGE_COUNT } from './scenes';
import { CROSSROADS_ID, makeCrossroads } from './scenes/crossroads';
import { OPENABLE_REGIONS, REGIONS, type RegionId } from './scenes/regions';
import { WORDS } from './words';

// 目安（外れたら警告する）
export const LIMITS = {
  // 得になる場面の数と、その地域の数
  minScenes: 3,
  minRegions: 2,
  // 攻撃なしで唱えるだけで得になる戦闘の割合
  maxVersatility: 0.5,
  // 場面ごとに、得になる言葉が何種類あるか
  minWaysPerScene: 2,
};

// いっしょに唱えてみる基本の言葉
const PARTNERS = ['', '炎', '槍'];
const OPENING_SCENES = ['rockfall', 'imp'];

// good：状況を変えて得をした soften：結果は同じで、ハートの減りだけ軽くなった
export type Effect = 'good' | 'soften' | 'bad' | 'change';

export interface Cell {
  word: string;
  scene: string;
  input: string;
  intent: string | null;
  effect: Effect;
  summary: string;
}

export interface WordUsage {
  id: string;
  text: string;
  goodScenes: string[];
  // 状況は変わらず、ハートの減りだけ軽くなった場面
  softenScenes: string[];
  badScenes: string[];
  regions: string[];
  // 攻撃なしで唱えるだけで得になる戦闘の割合
  versatility: number;
  // 旅1回で、得になる場面に出会う見こみの回数
  expected: number;
  // 同じ場面で同じ結果を出せる別の言葉（場面ごとの平均）
  overlap: number;
  warnings: string[];
}

export interface SceneUsage {
  id: string;
  title: string;
  region: string;
  goodWords: string[];
  appearance: number;
  warnings: string[];
}

export interface UsageReport {
  words: WordUsage[];
  scenes: SceneUsage[];
  cells: Cell[];
}

const fixed: Rng = () => 0.99;

// 結果の得の大きさ。ハート・お礼の言葉・出来事の言葉・開いた道は得、後悔は損
function value(o: Outcome): number {
  return o.hearts + (o.reward ? 1 : 0) + 0.5 * o.gainWords.length - (o.gainRegret ? 2 : 0)
    + (o.route && o.route !== 'road' ? 1 : 0);
}

function key(o: Outcome): string {
  return JSON.stringify([o.summary, o.hearts, o.reward, o.gainWords, o.gainRegret, o.flags, o.route ?? null]);
}

function cast(scene: SceneDef, input: string, intentIndex: number | null, owned: ReadonlySet<string>): Outcome | null {
  const r = scene.resolve(parseSpell(input, owned), {
    flags: {},
    warned: true,
    intent: intentIndex === null ? null : scene.intents![intentIndex],
    rng: fixed,
  });
  return r.kind === 'outcome' ? r.outcome : null;
}

export function sceneRegion(id: string): string {
  if (id === CROSSROADS_ID) return '分かれ道';
  if (OPENING_SCENES.includes(id)) return REGIONS.home.name;
  const found = (Object.keys(REGIONS) as RegionId[]).find((r) => REGIONS[r].scenes.includes(id));
  return found ? REGIONS[found].name : 'どこでも';
}

function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 旅1回で、それぞれの場面に出会う見こみの回数（分かれ道はでたらめに選ぶものとする） */
export function sceneAppearance(runs = 2000): Record<string, number> {
  const counts: Record<string, number> = {};
  const rng = seeded(1);
  for (let n = 0; n < runs; n++) {
    let used: string[] = [];
    let region: RegionId = 'home';
    const visited: RegionId[] = [];
    for (let stage = 0; stage < STAGE_COUNT; stage++) {
      const ids = buildStage(region, used, rng);
      used = [...used, ...ids];
      if (stage + 1 < STAGE_COUNT) {
        const choices: RegionId[] = [...OPENABLE_REGIONS.filter((r) => !visited.includes(r)), 'road'];
        region = choices[Math.floor(rng() * choices.length)];
        if (region !== 'road') visited.push(region);
      }
    }
    for (const id of used) counts[id] = (counts[id] ?? 0) + 1;
  }
  const result: Record<string, number> = { [CROSSROADS_ID]: STAGE_COUNT - 1 };
  for (const id of Object.keys(SCENES)) result[id] = (counts[id] ?? 0) / runs;
  return result;
}

export function buildUsageReport(): UsageReport {
  // 黒と白の言葉は、旅の進行（run.ts）でほかの言葉に上乗せされるので数えない
  const words = WORDS.filter((w) => w.kind !== 'target' && w.kind !== 'black' && w.kind !== 'white');
  const owned = new Set(words.map((w) => w.id));
  const scenes: SceneDef[] = [...Object.values(SCENES), makeCrossroads(OPENABLE_REGIONS)];
  const appearance = sceneAppearance();
  const cells: Cell[] = [];
  // word -> scene -> 得になった結果のまとめ
  const goodSummaries = new Map<string, Map<string, Set<string>>>();
  // 攻撃なしで唱えるだけで、どの構えにも得になった戦闘
  const aloneGood = new Map<string, Set<string>>();

  for (const scene of scenes) {
    const targets = ['', ...scene.objects({}).map((o) => o.keyword)];
    const intents: (number | null)[] = scene.intents ? scene.intents.map((_, i) => i) : [null];
    for (const w of words) {
      let aloneEverywhere = scene.kind === 'battle';
      for (const intent of intents) {
        let aloneHere = false;
        for (const t of targets) {
          for (const p of PARTNERS) {
            if (p === w.text) continue;
            const base = `${t ? `${t}に` : ''}${p}`;
            const input = `${base}${w.text}`;
            const before = cast(scene, base, intent, owned);
            const after = cast(scene, input, intent, owned);
            if (!before || !after || key(before) === key(after)) continue;
            const d = value(after) - value(before);
            const effect: Effect = d < 0 ? 'bad' : d === 0 ? 'change' : after.summary === before.summary ? 'soften' : 'good';
            const intentName = intent === null ? null : scene.intents![intent].name;
            cells.push({ word: w.id, scene: scene.id, input, intent: intentName, effect, summary: after.summary });
            if (effect === 'good') {
              const byScene = goodSummaries.get(w.id) ?? new Map<string, Set<string>>();
              byScene.set(scene.id, (byScene.get(scene.id) ?? new Set()).add(after.summary));
              goodSummaries.set(w.id, byScene);
              if (input === w.text) aloneHere = true;
            }
          }
        }
        if (!aloneHere) aloneEverywhere = false;
      }
      if (aloneEverywhere) aloneGood.set(w.id, (aloneGood.get(w.id) ?? new Set()).add(scene.id));
    }
  }

  const battles = scenes.filter((s) => s.kind === 'battle').length;
  const wordUsages: WordUsage[] = words.map((w) => {
    const byScene = goodSummaries.get(w.id) ?? new Map<string, Set<string>>();
    const goodScenes = [...byScene.keys()];
    const softenScenes = [...new Set(cells.filter((c) => c.effect === 'soften' && c.word === w.id).map((c) => c.scene))]
      .filter((s) => !goodScenes.includes(s));
    const badScenes = [...new Set(cells.filter((c) => c.effect === 'bad' && c.word === w.id).map((c) => c.scene))]
      .filter((s) => !goodScenes.includes(s) && !softenScenes.includes(s));
    const regions = [...new Set(goodScenes.map(sceneRegion))];
    const versatility = (aloneGood.get(w.id)?.size ?? 0) / battles;
    const expected = goodScenes.reduce((sum, s) => sum + (appearance[s] ?? 0), 0);
    const overlaps = goodScenes.map((s) => {
      const mine = byScene.get(s)!;
      return words.filter((o) => o.id !== w.id && [...(goodSummaries.get(o.id)?.get(s) ?? [])].some((x) => mine.has(x))).length;
    });
    const overlap = overlaps.length ? overlaps.reduce((a, b) => a + b, 0) / overlaps.length : 0;
    const warnings: string[] = [];
    if (goodScenes.length < LIMITS.minScenes) warnings.push(`使い道が${goodScenes.length}場面だけ`);
    if (regions.length < LIMITS.minRegions) warnings.push(`効く地域が${regions.length}つだけ`);
    if (versatility > LIMITS.maxVersatility) warnings.push(`戦闘の${Math.round(versatility * 100)}%で唱えるだけで得`);
    return { id: w.id, text: w.text, goodScenes, softenScenes, badScenes, regions, versatility, expected, overlap, warnings };
  });

  const sceneUsages: SceneUsage[] = scenes.map((s) => {
    const goodWords = wordUsages.filter((w) => w.goodScenes.includes(s.id)).map((w) => w.text);
    const warnings = goodWords.length < LIMITS.minWaysPerScene ? [`得になる言葉が${goodWords.length}種類だけ`] : [];
    return { id: s.id, title: s.title, region: sceneRegion(s.id), goodWords, appearance: appearance[s.id] ?? 0, warnings };
  });

  return { words: wordUsages, scenes: sceneUsages, cells };
}
