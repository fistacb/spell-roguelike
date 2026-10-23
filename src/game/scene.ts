// 場面の共通の型と、1回の詠唱で決着する戦闘の計算

import { isAttack, type Spell } from './parse';
import { ELEMENT_INFO, wordById, type Element, type Shape, type TargetId } from './words';

export type Rng = () => number;

export type GirlState =
  | 'grateful' // 助けられて感謝し、戦闘で加勢する
  | 'powered' // 強化されて自分で岩を砕き、戦闘で強く加勢する
  | 'overcharged' // 強化しすぎて暴走し、敵味方構わず攻撃する
  | 'walled' // 壁に守られ、壁の陰に隠れている
  | 'escaped' // 凍った川を滑って逃げた
  | 'dazed' // 岩に当たったが癒しのおかげで無事
  | 'angry' // 攻撃されて怒って帰った
  | 'hurt'; // 岩に当たってしまった

// 場面をまたいで引き継ぐ状態
export interface Flags {
  girl?: GirlState;
  treeBurned?: boolean;
  streamFrozen?: boolean;
  wallStands?: boolean;
  impStunned?: boolean;
}

export interface Outcome {
  log: string[];
  // ハートの増減
  hearts: number;
  flags: Flags;
  gainRegret: boolean;
  // 起こした出来事から生まれた言葉（煙・霜・礫）
  gainWords: string[];
  // うまく切り抜けたお礼の言葉。もう持っていればハート+1
  reward: string | null;
  // 分かれ道で選んだ次の地域
  route?: string;
  discoveries: string[];
  // 旅の記録に残す一言
  summary: string;
}

export interface Intent {
  name: string;
  element: Element;
  // 受けるとハートがいくつ減るか
  hearts: number;
  // 小川などの水の中を通る攻撃か
  inWater: boolean;
  // 地面を走ってくる攻撃か（霜で止められる）
  charge?: boolean;
  description: string;
}

export interface SceneObject {
  id: TargetId;
  label: string;
  keyword: string;
  desc: string;
  color: string;
}

export interface SceneCtx {
  flags: Flags;
  warned: boolean;
  intent: Intent | null;
  rng: Rng;
}

export type SceneResult = { kind: 'warning'; message: string } | { kind: 'outcome'; outcome: Outcome };

export interface SceneDef {
  id: string;
  title: string;
  kind: 'event' | 'battle';
  intents?: Intent[];
  intro(flags: Flags): string[];
  objects(flags: Flags): SceneObject[];
  resolve(spell: Spell, ctx: SceneCtx): SceneResult;
}

export function emptyOutcome(): Outcome {
  return { log: [], hearts: 0, flags: {}, gainRegret: false, gainWords: [], reward: null, discoveries: [], summary: '' };
}

export const REGRET_LINE = '黒い言葉「後悔」を手に入れた。';

export function outcome(o: Outcome): SceneResult {
  return { kind: 'outcome', outcome: o };
}

// ---- 戦闘 ----

export interface Enemy {
  name: string;
  targets: TargetId[];
  toughness: number;
  // 鎖で捕まえられるか
  chainable: boolean;
  // 形状ごとの効き方（群れには雨がよく効く、など）
  shapeMult?: Partial<Record<Shape, number>>;
}

export interface FightOptions {
  enemy: Enemy;
  intent: Intent;
  // 場面のしかけで下がったしぶとさ
  toughnessDown?: number;
  // 呪文以外から入るダメージ（加勢など）
  bonusDamage?: number;
  // 呪文の攻撃に掛かる倍率（感電など）と、その説明
  extraMult?: { mult: number; line: string };
  // 敵が攻撃してこない理由
  noAttack?: string;
  // 前の場面で立てた壁が残っている
  wallStands?: boolean;
}

export interface FightResult {
  log: string[];
  hearts: number;
  defeated: boolean;
  // 眠らせてやり過ごした
  slept: boolean;
  damage: number;
  usedWall: boolean;
  discoveries: string[];
  gainWords: string[];
}

const SHAPE_POWER: Record<Shape, number[]> = {
  spear: [6],
  blade: [3, 3],
  rain: [4],
  chain: [2],
  wall: [],
};

// 言葉が効いたときの演出。ログで目立たせる
export const FLASH = '✦ ';

export function targetsEnemy(spell: Spell, enemy: Enemy): boolean {
  if (spell.target === null) return isAttack(spell);
  return spell.target === 'enemy' || enemy.targets.includes(spell.target);
}

// 攻撃でなくても、敵に向けた呪文か（眠り・流れ・引き寄せなど）
function aimsAt(spell: Spell, enemy: Enemy): boolean {
  return spell.target === null || spell.target === 'enemy' || enemy.targets.includes(spell.target);
}

export function spellMultiplier(spell: Spell): number {
  let mult = 1;
  if (spell.supports.includes('boost') && (spell.target === null || spell.target === 'self' || spell.target === 'enemy')) mult *= 1.5;
  if (spell.supports.includes('echo')) mult *= 2;
  if (spell.regret) mult *= 2;
  return mult;
}

function flashLines(spell: Spell): string[] {
  return spell.usedWordIds
    .map((id) => wordById(id))
    .flatMap((w) => (w.kind === 'compound' ? [FLASH + w.flash] : []));
}

/** 1回の詠唱で「倒す」と「守る」を同時に判定する */
export function fight(spell: Spell, opts: FightOptions): FightResult {
  const { enemy, intent } = opts;
  const r: FightResult = { log: [], hearts: 0, defeated: false, slept: false, damage: 0, usedWall: false, discoveries: [], gainWords: [] };
  const mult = spellMultiplier(spell);
  const shield = intent.element;
  const aimed = aimsAt(spell, enemy);

  if (spell.supports.includes('heal') && (spell.target === null || spell.target === 'self')) {
    r.hearts += 1;
    r.log.push('癒しの光がハートを1つ取り戻した。');
  }
  if (spell.regret) {
    r.hearts -= 1;
    r.log.push('「後悔」が胸を締めつける。呪文の力が倍になったが、ハートを1つ失った。');
  }

  let captured = false;
  if (targetsEnemy(spell, enemy)) {
    const shapes = spell.shapes.filter((s) => s !== 'wall');
    const hits = shapes.length > 0
      ? shapes.flatMap((s) => SHAPE_POWER[s].map((p) => p * (enemy.shapeMult?.[s] ?? 1)))
      : spell.elements.length > 0 ? [3] : [];
    let emult = 1;
    if (hits.length > 0) {
      r.log.push(...flashLines(spell));
      if (spell.pure) {
        // 混ざった言葉や礫は、色に関係なく届く
      } else if (spell.elements.length === 0) {
        emult = 0.5;
        r.log.push('無属性の呪文はあまり効かない。');
      } else if (!spell.elements.some((e) => e !== shield)) {
        emult = 0.5;
        r.log.push(`${enemy.name}は${ELEMENT_INFO[shield].label}の色をまとっていて、同じ色の攻撃は半減された。`);
      }
      if (spell.supports.includes('echo')) {
        r.log.push(`${FLASH}呪文が山びこのように響き、もう一度${enemy.name}を打った！`);
        r.discoveries.push('響き：呪文がもう一度響いて力が倍になる');
      }
    }
    const extra = opts.extraMult?.mult ?? 1;
    if (opts.extraMult && hits.length > 0) r.log.push(opts.extraMult.line);
    for (const p of hits) r.damage += Math.ceil(p * emult * extra * mult);
  }
  r.damage += opts.bonusDamage ?? 0;

  let toughness = enemy.toughness - (opts.toughnessDown ?? 0);
  if (aimed && spell.tricks.includes('mud')) {
    toughness -= 4;
    r.log.push(`${FLASH}泥が${enemy.name}にまとわりつき、動きが鈍くなった。`);
    r.discoveries.push('泥：まとわりついて敵が弱る');
  }
  // 霜で転んだ敵は倒しやすい
  const slipped = spell.tricks.includes('frost') && intent.charge === true && !opts.noAttack;
  if (slipped) {
    toughness = Math.ceil(toughness / 2);
    r.log.push(`${FLASH}地面に霜が降りた。${enemy.name}は足をすべらせて派手に転んだ！`);
    r.discoveries.push('霜：走ってくる敵が転んで、倒しやすくなる');
  }
  toughness = Math.max(1, toughness);

  // 鎖はしぶとさの半分以上を削って弱らせたときだけ捕まえられる
  if (targetsEnemy(spell, enemy) && spell.shapes.includes('chain') && enemy.chainable) {
    if (r.damage >= Math.ceil(toughness / 2)) {
      captured = true;
      r.log.push(`弱った${enemy.name}を鎖が縛り上げた！`);
      r.discoveries.push('鎖：弱らせてから使うと捕まえられる');
    } else {
      r.log.push(`${enemy.name}はまだ元気で、鎖を振りほどいた。`);
    }
  }
  // 流れは、水の中にいる敵を押し流す
  let swept = false;
  if (aimed && spell.supports.includes('flow')) {
    if (intent.inWater) {
      swept = true;
      r.log.push(`${FLASH}水が逆巻き、${enemy.name}を下流へ押し流した！`);
      r.discoveries.push('流れ×水の中の敵：押し流す');
    } else {
      r.log.push(`足もとを水が流れたが、${enemy.name}は水の中にいない。`);
    }
  }
  r.defeated = captured || swept || r.damage >= toughness;
  if (r.damage > 0) r.log.push(`${enemy.name}に${r.damage}の力が届いた（倒すには${toughness}）。`);

  if (r.defeated) {
    if (!swept) r.log.push(captured ? `${enemy.name}は動けなくなった。` : `${enemy.name}を追い払った！`);
    return r;
  }

  // 眠りは、傷つけずにかけたときだけ効く
  if (aimed && spell.supports.includes('sleep')) {
    if (r.damage === 0) {
      r.slept = true;
      r.gainWords.push('quiet');
      r.log.push(`${FLASH}${enemy.name}のまぶたが下がり、すうすうと寝息を立てはじめた。`, 'その横を、そっと通り抜けた。');
      r.discoveries.push('眠り：傷つけずにかけると、敵が眠って通り抜けられる');
      return r;
    }
    r.log.push(`${enemy.name}は眠りかけたが、攻撃の痛みで目を覚ました。`);
  }

  // 倒せなかったら反撃を受ける
  if (opts.noAttack) {
    r.log.push(opts.noAttack);
    return r;
  }
  if (slipped) return r;
  if (opts.wallStands) {
    r.usedWall = true;
    r.log.push(`${enemy.name}の${intent.name}！ でも残っていた壁が受け止めた。`);
    return r;
  }
  let loss = intent.hearts;
  if (spell.shapes.includes('wall')) {
    const wallElement = spell.elements[0];
    if (wallElement === shield) {
      loss = 0;
      r.log.push(`${ELEMENT_INFO[shield].label}の壁が${intent.name}を完全に防いだ！`);
      r.discoveries.push(`同じ色の壁：${ELEMENT_INFO[shield].label}の攻撃を完全に防ぐ`);
    } else {
      loss = Math.max(0, loss - 1);
      r.log.push('壁が攻撃を少し和らげた。');
    }
  }
  if (aimed && spell.supports.includes('pull')) {
    if (intent.charge) {
      loss += 1;
      r.log.push(`${enemy.name}を引き寄せたら、勢いがついて飛びこんできた！`);
      r.discoveries.push('引き寄せ×突っこんでくる敵：かえって勢いがつく');
    } else if (loss > 0) {
      loss = 0;
      r.log.push(`${FLASH}${enemy.name}を目の前まで引き寄せた。${intent.name}を放つ間もない！`);
      r.discoveries.push('引き寄せ×離れた敵：飛び道具を封じる');
    }
  }
  if (loss > 0 && spell.tricks.includes('smoke')) {
    loss = 0;
    r.log.push(`${FLASH}煙にまぎれて、${enemy.name}の${intent.name}をかわした！`);
    r.discoveries.push('煙：敵の目をくらませて反撃をかわす');
  } else if (loss > 0 && spell.tricks.includes('frost')) {
    r.log.push(`霜が降りたが、${intent.name}は地面を走ってこない。`);
  }
  if (loss > 0) r.log.push(`${enemy.name}の${intent.name}！ ハートを${loss}つ失った。`);
  r.hearts -= loss;
  return r;
}

/** 戦闘の結果を場面の結果にまとめる */
export function absorb(o: Outcome, r: FightResult): void {
  o.log.push(...r.log);
  o.hearts += r.hearts;
  o.discoveries.push(...r.discoveries);
  o.gainWords.push(...r.gainWords);
}

export function pick<T>(items: T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length) % items.length];
}
