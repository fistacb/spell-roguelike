// 1回の旅（ラン）の進行：3つのステージを進む。ステージの終わりには宿と分かれ道があり、最後に旅の記録

import { parseSpell, type Spell } from './parse';
import { pick, type Flags, type Intent, type Rng, type SceneDef } from './scene';
import { buildStage, SCENES, STAGE_COUNT } from './scenes';
import { makeCrossroads } from './scenes/crossroads';
import { OPENABLE_REGIONS, REGIONS, type RegionId } from './scenes/regions';
import { STARTING_WORDS, wordById } from './words';

export const START_CHAR_LIMIT = 6;
// 文字数の上限はステージが進むごとに増える
export const CHAR_LIMIT_PER_STAGE = 2;
export const MAX_CHAR_LIMIT = 10;
export const START_HEARTS = 3;
export const MAX_HEARTS = 5;
// 宿で回復するハート
export const INN_HEARTS = 1;

export interface SceneRecord {
  title: string;
  spell: string;
  summary: string;
}

export interface RunState {
  // fork：ステージの終わりの分かれ道
  phase: 'scene' | 'fork' | 'record';
  result: 'complete' | 'tired' | null;
  hearts: number;
  owned: string[];
  charLimit: number;
  // 何ステージ目か（0から）と、その地域
  stage: number;
  region: RegionId;
  visitedRegions: RegionId[];
  // いまのステージの場面と、何場面目か
  sceneIds: string[];
  index: number;
  // この旅ですでに起きた場面
  usedScenes: string[];
  // 分かれ道に並ぶ地域
  forkOptions: RegionId[];
  intent: Intent | null;
  flags: Flags;
  warned: boolean;
  log: string[];
  gainedWords: string[];
  discoveries: string[];
  records: SceneRecord[];
  taboos: string[];
}

export interface CastResult {
  run: RunState;
  spell: Spell | null;
  warning?: string;
  error?: string;
}

export function currentScene(run: RunState): SceneDef {
  if (run.phase === 'fork') return makeCrossroads(run.forkOptions);
  return SCENES[run.sceneIds[Math.min(run.index, run.sceneIds.length - 1)]];
}

export function regionName(run: RunState): string {
  return REGIONS[run.region].name;
}

function enter(run: RunState, rng: Rng): RunState {
  const scene = SCENES[run.sceneIds[run.index]];
  const intent = scene.intents ? pick(scene.intents, rng) : null;
  return {
    ...run,
    phase: 'scene',
    intent,
    warned: false,
    log: [...run.log, `◆ ${scene.title}（${run.index + 1}/${run.sceneIds.length}）`, ...scene.intro(run.flags)],
  };
}

function enterStage(run: RunState, region: RegionId, rng: Rng, sceneIds = buildStage(region, run.usedScenes, rng)): RunState {
  return enter({
    ...run,
    region,
    visitedRegions: [...run.visitedRegions, region],
    sceneIds,
    index: 0,
    usedScenes: [...run.usedScenes, ...sceneIds],
    log: [...run.log, `■ ステージ${run.stage + 1}　${REGIONS[region].name}`],
  }, rng);
}

function enterFork(run: RunState): RunState {
  const forkOptions = OPENABLE_REGIONS.filter((r) => !run.visitedRegions.includes(r));
  const scene = makeCrossroads(forkOptions);
  return {
    ...run,
    phase: 'fork',
    forkOptions,
    intent: null,
    warned: false,
    log: [...run.log, `◆ ${scene.title}`, ...scene.intro(run.flags)],
  };
}

// firstStage は最初のステージの場面を指定するとき（テスト用）
export function newRun(rng: Rng = Math.random, firstStage?: string[]): RunState {
  return enterStage({
    phase: 'scene',
    result: null,
    hearts: START_HEARTS,
    owned: [...STARTING_WORDS],
    charLimit: START_CHAR_LIMIT,
    stage: 0,
    region: 'home',
    visitedRegions: [],
    sceneIds: [],
    index: 0,
    usedScenes: [],
    forkOptions: [],
    intent: null,
    flags: {},
    warned: false,
    log: [],
    gainedWords: [],
    discoveries: [],
    records: [],
    taboos: [],
  }, 'home', rng, firstStage);
}

function merge(into: string[], add: string[]): string[] {
  return [...into, ...add.filter((d) => !into.includes(d))];
}

/**
 * 呪文を唱える。文字数オーバーは唱えずにエラーを返す。
 * 人に攻撃しようとした初回は警告だけ返し、もう一度唱えると実行される。
 */
export function cast(run: RunState, input: string, rng: Rng = Math.random): CastResult {
  if (run.phase === 'record') return { run, spell: null, error: '旅は終わった。' };
  const spell = parseSpell(input.trim(), new Set(run.owned));
  if (spell.length === 0) return { run, spell: null, error: '呪文を入力してください。' };
  if (spell.length > run.charLimit) {
    return { run, spell, error: `文字数が多すぎる（${spell.length}／${run.charLimit}文字）。` };
  }

  const scene = currentScene(run);
  const result = scene.resolve(spell, { flags: run.flags, warned: run.warned, intent: run.intent, rng });
  if (result.kind === 'warning') {
    return { run: { ...run, warned: true }, spell, warning: result.message };
  }
  const o = result.outcome;

  // 黒の言葉を持ったまま悪いことを重ねると禁忌がつく
  let owned = run.owned;
  let gainedWords = run.gainedWords;
  let taboos = run.taboos;
  const log = [...run.log, `▶ ${spell.input}`, ...unownedNotes(spell), ...o.log];
  if (o.gainRegret) {
    if (owned.includes('regret')) {
      taboos = [...taboos, `禁忌：${o.summary}`];
      log.push(`「後悔」が黒く重くなった……。禁忌がついた（${o.summary}）。`);
    } else {
      owned = [...owned, 'regret'];
      gainedWords = [...gainedWords, 'regret'];
    }
  }

  // 出来事の言葉と、お礼の言葉
  let heartGain = o.hearts;
  for (const id of o.gainWords) {
    if (owned.includes(id)) continue;
    owned = [...owned, id];
    gainedWords = [...gainedWords, id];
    log.push(`出来事の言葉「${wordById(id).text}」を手に入れた！`);
  }
  if (o.reward) {
    const text = wordById(o.reward).text;
    if (owned.includes(o.reward)) {
      heartGain += 1;
      log.push(`「${text}」はもう知っている。かわりにハートが1つ増えた。`);
    } else {
      owned = [...owned, o.reward];
      gainedWords = [...gainedWords, o.reward];
      log.push(`言葉「${text}」を手に入れた！`);
    }
  }

  const hearts = Math.max(0, Math.min(MAX_HEARTS, run.hearts + heartGain));
  const next: RunState = {
    ...run,
    hearts,
    owned,
    gainedWords,
    taboos,
    flags: { ...run.flags, ...o.flags },
    discoveries: merge(run.discoveries, o.discoveries),
    records: [...run.records, { title: scene.title, spell: spell.input, summary: o.summary }],
    log,
  };

  if (hearts <= 0) {
    return { spell, run: { ...next, phase: 'record', result: 'tired', log: [...log, 'ハートがなくなった。'] } };
  }

  // 分かれ道を抜けたら、次のステージへ
  if (run.phase === 'fork') {
    const region = (o.route ?? 'road') as RegionId;
    const charLimit = Math.min(MAX_CHAR_LIMIT, run.charLimit + CHAR_LIMIT_PER_STAGE);
    log.push(`詠唱できる文字数が${charLimit}文字に増えた。`);
    return { spell, run: enterStage({ ...next, stage: run.stage + 1, charLimit }, region, rng) };
  }

  if (run.index + 1 < run.sceneIds.length) {
    return { spell, run: enter({ ...next, index: run.index + 1 }, rng) };
  }
  if (run.stage + 1 >= STAGE_COUNT) {
    return { spell, run: { ...next, phase: 'record', result: 'complete' } };
  }

  // ステージの終わり：宿に泊まってから分かれ道へ
  const rested = Math.min(MAX_HEARTS, hearts + INN_HEARTS);
  log.push('◆ 宿屋', `${regionName(run)}を抜けて、宿に泊まった。`,
    rested > hearts ? `ぐっすり眠って、ハートが${rested - hearts}つ回復した。` : 'ぐっすり眠った。', '（ここまでの旅を記録した）');
  return { spell, run: enterFork({ ...next, hearts: rested }) };
}

function unownedNotes(spell: Spell): string[] {
  return spell.tokens.filter((t) => t.type === 'unowned').map((t) => `「${t.text}」はまだ知らない言葉だ。何も起きない。`);
}

export function endingMessage(run: RunState): string {
  if (run.result === 'complete') return '君は新しい旅に出ることにした！';
  return '君は疲れたので故郷に帰ることにした。';
}
