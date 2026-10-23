// 1回の旅（ラン）の進行：5つの場面を1回ずつの詠唱で進み、最後に旅の記録

import { parseSpell, type Spell } from './parse';
import { pick, type Flags, type Intent, type Rng } from './scene';
import { buildJourney, SCENES } from './scenes';
import { STARTING_WORDS, wordById } from './words';

export const START_CHAR_LIMIT = 6;
export const MAX_CHAR_LIMIT = 10;
export const START_HEARTS = 3;
export const MAX_HEARTS = 5;

export interface SceneRecord {
  title: string;
  spell: string;
  summary: string;
}

export interface RunState {
  phase: 'scene' | 'record';
  result: 'complete' | 'tired' | null;
  hearts: number;
  owned: string[];
  charLimit: number;
  sceneIds: string[];
  index: number;
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

export function currentScene(run: RunState) {
  return SCENES[run.sceneIds[Math.min(run.index, run.sceneIds.length - 1)]];
}

function enter(run: RunState, rng: Rng): RunState {
  const scene = SCENES[run.sceneIds[run.index]];
  const intent = scene.intents ? pick(scene.intents, rng) : null;
  return {
    ...run,
    intent,
    warned: false,
    log: [...run.log, `◆ ${scene.title}（${run.index + 1}/${run.sceneIds.length}）`, ...scene.intro(run.flags)],
  };
}

export function newRun(rng: Rng = Math.random, sceneIds: string[] = buildJourney(rng)): RunState {
  return enter({
    phase: 'scene',
    result: null,
    hearts: START_HEARTS,
    owned: [...STARTING_WORDS],
    charLimit: START_CHAR_LIMIT,
    sceneIds,
    index: 0,
    intent: null,
    flags: {},
    warned: false,
    log: [],
    gainedWords: [],
    discoveries: [],
    records: [],
    taboos: [],
  }, rng);
}

function merge(into: string[], add: string[]): string[] {
  return [...into, ...add.filter((d) => !into.includes(d))];
}

/**
 * 呪文を唱える。文字数オーバーは唱えずにエラーを返す。
 * 人に攻撃しようとした初回は警告だけ返し、もう一度唱えると実行される。
 */
export function cast(run: RunState, input: string, rng: Rng = Math.random): CastResult {
  if (run.phase !== 'scene') return { run, spell: null, error: '旅は終わった。' };
  const spell = parseSpell(input.trim(), new Set(run.owned));
  if (spell.length === 0) return { run, spell: null, error: '呪文を入力してください。' };
  if (spell.length > run.charLimit) {
    return { run, spell, error: `文字数が多すぎる（${spell.length}／${run.charLimit}文字）。` };
  }

  const scene = SCENES[run.sceneIds[run.index]];
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
  const charLimit = Math.min(MAX_CHAR_LIMIT, run.charLimit + 1);
  const next: RunState = {
    ...run,
    hearts,
    owned,
    gainedWords,
    taboos,
    charLimit,
    flags: { ...run.flags, ...o.flags },
    discoveries: merge(run.discoveries, o.discoveries),
    records: [...run.records, { title: scene.title, spell: spell.input, summary: o.summary }],
    log,
  };

  if (hearts <= 0) {
    return { spell, run: { ...next, phase: 'record', result: 'tired', log: [...log, 'ハートがなくなった。'] } };
  }
  if (run.index + 1 >= run.sceneIds.length) {
    return { spell, run: { ...next, phase: 'record', result: 'complete' } };
  }
  if (charLimit > run.charLimit) log.push(`詠唱できる文字数が${charLimit}文字に増えた。`);
  return { spell, run: enter({ ...next, index: run.index + 1 }, rng) };
}

function unownedNotes(spell: Spell): string[] {
  return spell.tokens.filter((t) => t.type === 'unowned').map((t) => `「${t.text}」はまだ知らない言葉だ。何も起きない。`);
}

export function endingMessage(run: RunState): string {
  if (run.result === 'complete') return '君は新しい旅に出ることにした！';
  return '君は疲れたので故郷に帰ることにした。';
}
