// 1回の旅（ラン）の進行：3つのステージを進む。ステージの終わりには宿と分かれ道があり、最後に旅の記録

import { isAttack, parseSpell, type Spell } from './parse';
import { pick, type Flags, type Intent, type Rng, type SceneDef } from './scene';
import { buildStage, SCENES, STAGE_COUNT } from './scenes';
import { makeCrossroads } from './scenes/crossroads';
import { OPENABLE_REGIONS, REGIONS, type RegionId } from './scenes/regions';
import { COMBOS, countsToHand, FIZZLE, HAND_LIMIT, STARTING_WORDS, wordById } from './words';

export const START_CHAR_LIMIT = 6;
// 文字数の上限はステージが進むごとに増える
export const CHAR_LIMIT_PER_STAGE = 2;
export const MAX_CHAR_LIMIT = 10;
export const START_HEARTS = 3;
export const MAX_HEARTS = 5;
// 宿で回復するハート
export const INN_HEARTS = 1;
// 禁忌がこの数たまると、魔王になって旅が終わる
export const TABOO_LIMIT = 3;

export interface SceneRecord {
  title: string;
  spell: string;
  summary: string;
}

export interface RunState {
  // fork：ステージの終わりの分かれ道
  phase: 'scene' | 'fork' | 'record';
  result: 'complete' | 'tired' | 'demon' | null;
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
  // 手札があふれていて、忘れる言葉を選ぶ必要がある
  mustForget: boolean;
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
    mustForget: false,
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
  if (run.mustForget) return { run, spell: null, error: '言葉が多すぎる。忘れる言葉を1つ選んでください。' };
  const spell = parseSpell(input.trim(), new Set(run.owned));
  if (spell.length === 0) return { run, spell: null, error: '呪文を入力してください。' };
  if (spell.length > run.charLimit) {
    return { run, spell, error: `文字数が多すぎる（${spell.length}／${run.charLimit}文字）。` };
  }

  const scene = currentScene(run);
  // 出来事の場面では、後悔と覚悟は「強化」のように働く。攻撃を攻撃でなくしてしまわないよう、攻撃には足さない
  const strong = scene.kind === 'event' && (spell.regret || spell.resolve) && !spell.supports.includes('boost') && !isAttack(spell);
  const result = scene.resolve(strong ? { ...spell, supports: [...spell.supports, 'boost'] } : spell, { flags: run.flags, warned: run.warned, intent: run.intent, rng });
  if (result.kind === 'warning') {
    return { run: { ...run, warned: true }, spell, warning: result.message };
  }
  const o = result.outcome;

  // 黒の言葉を持ったまま悪いことを重ねると禁忌がつく
  let owned = run.owned;
  let gainedWords = run.gainedWords;
  let taboos = run.taboos;
  let heartGain = o.hearts;
  const log = [...run.log, `▶ ${spell.input}`, ...unownedNotes(spell)];
  if (strong) {
    log.push(spell.regret ? '「後悔」にすがると、呪文がぐっと重く、強くなった。' : '「覚悟」が呪文を静かに後押しした。');
  }
  log.push(...o.log, ...fizzleNotes(spell, [...o.log, ...o.discoveries]));
  if (scene.kind === 'event' && spell.regret) {
    heartGain -= 1;
    log.push('「後悔」が胸を締めつける。ハートを1つ失った。');
  }
  if (o.gainRegret) {
    if (owned.includes('regret')) {
      taboos = [...taboos, o.summary];
      log.push(`「後悔」が黒く重くなった……。禁忌がついた（${o.summary}）。`,
        `禁忌の重みで、ハートの上限が1つ減った（禁忌 ${taboos.length}/${TABOO_LIMIT}。${TABOO_LIMIT}つたまると魔王になる）。`);
    } else {
      owned = [...owned, 'regret'];
      gainedWords = [...gainedWords, 'regret'];
      log.push('悪いことを重ねると禁忌がつく。この後悔にすがってだれかを助けられたら、乗りこえられるかもしれない。');
    }
  }
  // 後悔にすがって誰かを助けられたら、後悔は覚悟に変わる（戦闘の結果には、後悔の痛みがすでに入っている）
  const helped = o.reward !== null || o.hearts + (scene.kind === 'battle' ? 1 : 0) > 0;
  if (spell.regret && run.phase === 'scene' && !o.gainRegret && helped && owned.includes('regret')) {
    owned = [...owned.filter((id) => id !== 'regret' && id !== 'resolve'), 'resolve'];
    if (!gainedWords.includes('resolve')) gainedWords = [...gainedWords, 'resolve'];
    log.push('後悔にすがったこの手で、だれかを助けることができた。', '✦ 「後悔」が「覚悟」に変わった！');
  }

  // 出来事の言葉と、お礼の言葉
  for (const id of o.gainWords) {
    if (owned.includes(id)) continue;
    owned = [...owned, id];
    gainedWords = [...gainedWords, id];
    log.push(`出来事の言葉「${wordById(id).text}」を手に入れた！`);
  }
  // 言葉が混ざり合って、新しい言葉が生まれる
  for (const combo of COMBOS) {
    if (!combo.ids.every((id) => spell.usedWordIds.includes(id)) || owned.includes(combo.result)) continue;
    owned = [...owned, combo.result];
    gainedWords = [...gainedWords, combo.result];
    const [a, b] = combo.ids.map((id) => wordById(id).text);
    log.push(`✦ 「${a}」と「${b}」が混ざり合って、新しい言葉「${wordById(combo.result).text}」が生まれた！`);
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

  const hearts = Math.max(0, Math.min(maxHearts(taboos), run.hearts + heartGain));
  const next: RunState = {
    ...run,
    hearts,
    owned,
    mustForget: handSize(owned) > HAND_LIMIT,
    gainedWords,
    taboos,
    flags: { ...run.flags, ...o.flags },
    discoveries: merge(run.discoveries, o.discoveries),
    records: [...run.records, { title: scene.title, spell: spell.input, summary: o.summary }],
    log,
  };

  if (taboos.length >= TABOO_LIMIT) {
    return { spell, run: { ...next, phase: 'record', result: 'demon', log: [...log, '胸の奥の黒いものが、すべてを飲みこんだ。'] } };
  }
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
  const rested = Math.min(maxHearts(taboos), hearts + INN_HEARTS);
  log.push('◆ 宿屋', `${regionName(run)}を抜けて、宿に泊まった。`,
    rested > hearts ? `ぐっすり眠って、ハートが${rested - hearts}つ回復した。` : 'ぐっすり眠った。');
  log.push('（ここまでの旅を記録した）');
  return { spell, run: enterFork({ ...next, hearts: rested }) };
}

/** 禁忌がつくたびに、ハートの上限が1つ減る */
export function maxHearts(taboos: string[]): number {
  return MAX_HEARTS - taboos.length;
}

export function handSize(owned: string[]): number {
  return owned.filter(countsToHand).length;
}

/** 手札があふれたとき、言葉を1つ忘れる */
export function forget(run: RunState, id: string): RunState {
  if (!run.owned.includes(id) || !countsToHand(id)) return run;
  const owned = run.owned.filter((w) => w !== id);
  return {
    ...run,
    owned,
    mustForget: handSize(owned) > HAND_LIMIT,
    log: [...run.log, `言葉「${wordById(id).text}」を忘れた。`],
  };
}

/** 唱えた言葉が何も起こさなかったら、空振りの一言を添える */
function fizzleNotes(spell: Spell, lines: string[]): string[] {
  return [...new Set(spell.usedWordIds)].flatMap((id) => {
    const f = FIZZLE[id];
    if (!f || lines.some((l) => f.marks.some((m) => l.includes(m)))) return [];
    return [f.line];
  });
}

function unownedNotes(spell: Spell): string[] {
  return spell.tokens.filter((t) => t.type === 'unowned').map((t) => `「${t.text}」はまだ知らない言葉だ。何も起きない。`);
}

export function endingMessage(run: RunState): string {
  if (run.result === 'complete') return '君は新しい旅に出ることにした！';
  if (run.result === 'demon') return '君は禁忌を重ね、魔王になった……。';
  return '君は疲れたので故郷に帰ることにした。';
}
