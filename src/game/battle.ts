// 場面B：岩を落としたいたずら小鬼との戦闘。2〜4ターンで終わる想定

import { type Spell } from './parse';
import type { SceneAOutcome, GirlState } from './sceneA';
import { ELEMENT_INFO, type Element, type Shape, type TargetId } from './words';

export type Rng = () => number;

export interface Intent {
  name: string;
  element: Element;
  power: number;
  // 行動中の小鬼の位置。小川にいるときは雷がよく効く
  position: 'cliff' | 'stream';
  description: string;
}

export const INTENTS: Intent[] = [
  { name: '土の投石', element: 'earth', power: 5, position: 'cliff', description: '崖の上から石を投げようとしている' },
  { name: '雷の体当たり', element: 'thunder', power: 7, position: 'stream', description: '小川を渡って体当たりしようとしている' },
];

export const PLAYER_MAX_HP = 20;
export const IMP_MAX_HP = 24;

export interface BattleState {
  playerHp: number;
  impHp: number;
  turn: number;
  intentIndex: number;
  girl: GirlState;
  treeBurned: boolean;
  streamFrozen: boolean;
  // 場面Aで立てた壁。最初の攻撃を1回防ぐ
  wallStands: boolean;
  impStunned: boolean;
  impBound: boolean;
  chainImmune: boolean;
  log: string[];
  discoveries: string[];
  result: 'win' | 'lose' | null;
}

export function createBattle(outcome: SceneAOutcome): BattleState {
  const log = ['崖の上から、いたずら小鬼が飛び降りてきた！'];
  if (outcome.treeBurned) log.push('小鬼は煙でむせていて、力が出ないようだ。');
  if (outcome.streamFrozen) log.push('小川は凍ったままだ。');
  if (outcome.impStunned) log.push('小鬼はさっきの騒ぎを見て笑い転げている。');
  log.push(girlIntro(outcome.girl));
  return {
    playerHp: PLAYER_MAX_HP,
    impHp: IMP_MAX_HP,
    turn: 1,
    intentIndex: 0,
    girl: outcome.girl,
    treeBurned: outcome.treeBurned,
    streamFrozen: outcome.streamFrozen,
    wallStands: outcome.wallStands,
    impStunned: outcome.impStunned,
    impBound: false,
    chainImmune: false,
    log,
    discoveries: [],
    result: null,
  };
}

function girlIntro(girl: GirlState): string {
  switch (girl) {
    case 'grateful': return '女の子「わたしも戦う！」';
    case 'powered': return '女の子は腕まくりしている。「まかせて！」';
    case 'overcharged': return '女の子はまだ目がぐるぐるしている……。';
    case 'walled': return '女の子は壁の陰から見守っている。';
    case 'escaped': return '女の子は凍った小川の向こうで手を振っている。';
    case 'dazed': return '女の子はたんこぶをさすりながら石を拾った。';
    case 'angry': return '女の子はもういない。';
    case 'hurt': return '女の子はうずくまって動けない。';
  }
}

export function currentIntent(state: BattleState): Intent {
  return INTENTS[state.intentIndex % INTENTS.length];
}

const SHAPE_POWER: Record<Shape, number[]> = {
  spear: [6],
  blade: [3, 3],
  rain: [4],
  chain: [2],
  wall: [],
};

function defaultTarget(spell: Spell): TargetId {
  const attacks = spell.shapes.some((s) => s !== 'wall') || (spell.elements.length > 0 && spell.shapes.length === 0 && spell.supports.length === 0);
  if (attacks) return 'imp';
  return 'self';
}

function elementMultiplier(elements: Element[], shield: Element): { mult: number; note: string | null } {
  if (elements.length === 0) return { mult: 0.5, note: '無属性の呪文は小鬼にあまり効かない。' };
  if (elements.some((e) => e !== shield)) return { mult: 1, note: null };
  return { mult: 0.5, note: `小鬼は${ELEMENT_INFO[shield].label}の色をまとっていて、同じ色の攻撃は半減された。` };
}

function addDiscovery(state: BattleState, text: string) {
  if (!state.discoveries.includes(text)) state.discoveries.push(text);
}

/**
 * プレイヤーの1ターン（詠唱→女の子→小鬼）を進める。
 * 文字数の上限チェックは呼び出し側で行う。
 */
export function playTurn(prev: BattleState, spell: Spell, rng: Rng): BattleState {
  const s: BattleState = { ...prev, log: [], discoveries: [...prev.discoveries] };
  const intent = currentIntent(s);
  const target = spell.target ?? defaultTarget(spell);
  let mult = spell.supports.includes('boost') && target !== 'girl' ? 1.5 : 1;
  if (spell.regret) {
    mult *= 2;
    s.playerHp -= 3;
    s.log.push('「後悔」が胸を締めつける。呪文の力が増したが、3のダメージを受けた。');
  }
  let block = 0;
  let girlBoost = false;

  if (spell.usedWordIds.length === 0) {
    s.log.push('呪文は何も起こさなかった。');
  }

  // 雨は場面全体に降るので、オブジェクトにも反応する
  const touchesTree = target === 'tree' || spell.shapes.includes('rain');
  const touchesStream = target === 'stream' || spell.shapes.includes('rain');
  if (touchesTree && spell.elements.includes('fire') && !s.treeBurned) {
    s.treeBurned = true;
    s.log.push('枯れ木が燃え上がった！ 煙で小鬼がむせている。');
    addDiscovery(s, '炎×枯れ木：燃えて煙が出る（小鬼が弱る）');
  }
  if (touchesStream && spell.elements.includes('ice') && !s.streamFrozen) {
    s.streamFrozen = true;
    s.log.push('小川が凍りついた。');
    addDiscovery(s, '氷×小川：凍って滑る地面になる');
  }
  if (target === 'stream' && spell.elements.includes('thunder')) {
    if (intent.position === 'stream' && !s.streamFrozen) {
      const dmg = Math.ceil(8 * mult);
      s.impHp -= dmg;
      s.log.push(`小川に雷が走った！ 水の中の小鬼が感電して${dmg}のダメージ！`);
      addDiscovery(s, '雷×小川：水の中にいる者が感電する');
    } else {
      s.log.push('小川がバチバチと光った。でも誰も水に入っていない。');
    }
  }
  if (target === 'rock') s.log.push('岩はもう地面に転がっている。');
  if (target === 'tree' && !spell.elements.includes('fire')) s.log.push('枯れ木は少しゆれただけだった。');

  if (target === 'imp') {
    const { mult: emult, note } = elementMultiplier(spell.elements, intent.element);
    let shock = 1;
    if (spell.elements.includes('thunder') && intent.position === 'stream' && !s.streamFrozen) {
      shock = 2;
      addDiscovery(s, '雷×小川にいる小鬼：感電して2倍のダメージ');
    }
    const shapes = spell.shapes.filter((sh) => sh !== 'wall');
    const hits = shapes.length > 0 ? shapes.flatMap((sh) => SHAPE_POWER[sh]) : spell.elements.length > 0 ? [3] : [];
    let total = 0;
    for (const p of hits) total += Math.ceil(p * emult * shock * mult);
    if (spell.shapes.includes('chain')) {
      if (s.chainImmune) {
        s.log.push('小鬼は鎖をひらりとかわした。同じ手は続けて効かない。');
      } else {
        s.impBound = true;
        s.log.push('鎖が小鬼を縛った！');
      }
    }
    if (total > 0) {
      if (note) s.log.push(note);
      if (shock > 1) s.log.push('小川にいた小鬼が感電した！');
      s.impHp -= total;
      s.log.push(`小鬼に${total}のダメージ！`);
    }
  }

  if (spell.shapes.includes('wall')) {
    const wallElement = spell.elements[0];
    if (wallElement === intent.element) {
      block = Infinity;
      s.log.push(`${ELEMENT_INFO[wallElement].label}の壁が立ち上がった。次の攻撃と同じ色だ！`);
    } else {
      block = Math.ceil(3 * mult);
      s.log.push(`壁が立ち上がった（${block}を防ぐ）。`);
    }
  }

  if (spell.supports.includes('heal')) {
    if (target === 'girl') {
      s.log.push('女の子の顔色がよくなった。');
    } else {
      const heal = Math.ceil(6 * mult);
      s.playerHp = Math.min(PLAYER_MAX_HP, s.playerHp + heal);
      s.log.push(`癒しの光で${heal}回復した。`);
    }
  }
  if (spell.supports.includes('boost') && target === 'girl') {
    if (isGirlFighting(s.girl)) {
      girlBoost = true;
      s.log.push('女の子に力が満ちた！');
    } else {
      s.log.push('女の子はここにいない。');
    }
  }

  if (s.playerHp <= 0) return finish(s, 'lose');
  if (s.impHp <= 0) return finish(s, 'win');

  girlActs(s, girlBoost, rng);
  if (s.playerHp <= 0) return finish(s, 'lose');
  if (s.impHp <= 0) return finish(s, 'win');

  impActs(s, intent, block, rng);
  if (s.playerHp <= 0) return finish(s, 'lose');

  s.intentIndex += 1;
  s.turn += 1;
  return s;
}

function isGirlFighting(girl: GirlState): boolean {
  return girl === 'grateful' || girl === 'powered' || girl === 'overcharged' || girl === 'dazed';
}

function girlActs(s: BattleState, boosted: boolean, rng: Rng) {
  const factor = boosted ? 2 : 1;
  switch (s.girl) {
    case 'grateful':
      s.impHp -= 2 * factor;
      s.log.push(`女の子が石を投げた！ 小鬼に${2 * factor}のダメージ。`);
      break;
    case 'powered':
      s.impHp -= 4 * factor;
      s.log.push(`女の子のげんこつ！ 小鬼に${4 * factor}のダメージ。`);
      break;
    case 'dazed':
      s.impHp -= 1 * factor;
      s.log.push(`女の子がふらふらしながら石を投げた。小鬼に${1 * factor}のダメージ。`);
      break;
    case 'overcharged':
      if (rng() < 0.3) {
        s.playerHp -= 3 * factor;
        s.log.push(`暴走した女の子のげんこつがこっちに飛んできた！ ${3 * factor}のダメージ……。`);
      } else {
        s.impHp -= 5 * factor;
        s.log.push(`暴走した女の子が小鬼を殴り飛ばした！ ${5 * factor}のダメージ。`);
      }
      break;
    default:
      break;
  }
}

function impActs(s: BattleState, intent: Intent, block: number, rng: Rng) {
  if (s.impStunned) {
    s.impStunned = false;
    s.log.push('小鬼はまだ笑い転げていて、何もしなかった。');
    return;
  }
  if (s.impBound) {
    s.impBound = false;
    s.chainImmune = true;
    s.log.push('小鬼は鎖に縛られて動けない！');
    return;
  }
  if (intent.position === 'stream' && s.streamFrozen && rng() < 0.5) {
    s.chainImmune = false;
    s.log.push('小鬼は凍った小川ですべって転んだ！');
    addDiscovery(s, '凍った小川：渡ろうとした者が転ぶ');
    return;
  }
  s.chainImmune = false;
  let power = intent.power - (s.treeBurned ? 2 : 0);
  if (s.wallStands) {
    s.wallStands = false;
    s.log.push(`小鬼の${intent.name}！ でも最初に立てた壁が受け止めて、壁は崩れた。`);
    return;
  }
  power = Math.max(0, power - block);
  s.playerHp -= power;
  s.log.push(power > 0 ? `小鬼の${intent.name}！ ${power}のダメージを受けた。` : `小鬼の${intent.name}！ 壁がすべて防いだ。`);
}

function finish(s: BattleState, result: 'win' | 'lose'): BattleState {
  s.result = result;
  s.log.push(result === 'win' ? '小鬼は「ごめんなさーい！」と逃げていった。' : '目の前が暗くなった……。');
  return s;
}
