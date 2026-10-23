// 1回の旅（ラン）の進行：場面A → 場面B（戦闘） → 旅の記録

import { createBattle, playTurn, type BattleState, type Rng } from './battle';
import { parseSpell, type Spell } from './parse';
import { resolveSceneA, type SceneAOutcome } from './sceneA';
import { STARTING_WORDS } from './words';

export const START_CHAR_LIMIT = 6;

export type Phase = 'sceneA' | 'battle' | 'record';

export interface RunState {
  phase: Phase;
  owned: string[];
  charLimit: number;
  warned: boolean;
  sceneA: SceneAOutcome | null;
  battle: BattleState | null;
  spells: string[];
  gainedWords: string[];
  discoveries: string[];
  log: string[];
}

export interface CastResult {
  run: RunState;
  spell: Spell | null;
  warning?: string;
  error?: string;
}

export function newRun(): RunState {
  return {
    phase: 'sceneA',
    owned: [...STARTING_WORDS],
    charLimit: START_CHAR_LIMIT,
    warned: false,
    sceneA: null,
    battle: null,
    spells: [],
    gainedWords: [],
    discoveries: [],
    log: ['崖下の小道を歩いていると、頭上でガラッと音がした。', '女の子の真上に、岩が落ちてくる！'],
  };
}

function mergeDiscoveries(into: string[], add: string[]): string[] {
  return [...into, ...add.filter((d) => !into.includes(d))];
}

/**
 * 呪文を唱える。文字数オーバーは唱えずにエラーを返す。
 * 場面Aで人に攻撃しようとした初回は警告だけ返し、もう一度唱えると実行される。
 */
export function cast(run: RunState, input: string, rng: Rng = Math.random): CastResult {
  const spell = parseSpell(input.trim(), new Set(run.owned));
  if (spell.length === 0) return { run, spell: null, error: '呪文を入力してください。' };
  if (spell.length > run.charLimit) {
    return { run, spell, error: `文字数が多すぎる（${spell.length}／${run.charLimit}文字）。` };
  }

  if (run.phase === 'sceneA') {
    const result = resolveSceneA(spell, run.warned);
    if (result.kind === 'warning') {
      return { run: { ...run, warned: true }, spell, warning: result.message };
    }
    const outcome = result.outcome;
    const owned = outcome.gainRegret && !run.owned.includes('regret') ? [...run.owned, 'regret'] : run.owned;
    const gainedWords = outcome.gainRegret ? [...run.gainedWords, 'regret'] : run.gainedWords;
    const battle = createBattle(outcome);
    return {
      spell,
      run: {
        ...run,
        phase: 'battle',
        owned,
        gainedWords,
        charLimit: run.charLimit + 1,
        sceneA: outcome,
        battle,
        spells: [...run.spells, spell.input],
        discoveries: mergeDiscoveries(run.discoveries, outcome.discoveries),
        log: [...run.log, `▶ ${spell.input}`, ...unownedNotes(spell), ...outcome.log, `詠唱できる文字数が${run.charLimit + 1}文字に増えた。`, '──', ...battle.log],
      },
    };
  }

  if (run.phase === 'battle' && run.battle) {
    const battle = playTurn(run.battle, spell, rng);
    const done = battle.result !== null;
    return {
      spell,
      run: {
        ...run,
        phase: done ? 'record' : 'battle',
        battle,
        spells: [...run.spells, spell.input],
        discoveries: mergeDiscoveries(run.discoveries, battle.discoveries),
        log: [...run.log, `▶ ${spell.input}`, ...unownedNotes(spell), ...battle.log],
      },
    };
  }
  return { run, spell, error: 'いまは唱えられない。' };
}

function unownedNotes(spell: Spell): string[] {
  return spell.tokens.filter((t) => t.type === 'unowned').map((t) => `「${t.text}」はまだ知らない言葉だ。何も起きない。`);
}

export function endingMessage(run: RunState): string {
  if (run.battle?.result === 'win') return '君は新しい旅に出ることにした！';
  return '君は疲れたので故郷に帰ることにした。';
}
