// 場面A：崖下の小道。女の子の頭上に岩が落ちてくる。詠唱は1回だけ

import { isAttack, isEmpty, type Spell } from './parse';
import type { TargetId } from './words';

export type GirlState =
  | 'grateful' // 助けられて感謝し、戦闘で加勢する
  | 'powered' // 強化されて自分で岩を砕き、戦闘で強く加勢する
  | 'overcharged' // 強化しすぎて暴走し、敵味方構わず攻撃する
  | 'walled' // 壁に守られ、壁の陰に隠れている
  | 'escaped' // 凍った川を滑って逃げた
  | 'dazed' // 岩に当たったが癒しのおかげで無事
  | 'angry' // 攻撃されて怒って帰った
  | 'hurt'; // 岩に当たってしまった

export interface SceneAOutcome {
  log: string[];
  girl: GirlState;
  treeBurned: boolean;
  streamFrozen: boolean;
  wallStands: boolean;
  impStunned: boolean;
  gainRegret: boolean;
  discoveries: string[];
}

export type SceneAResult = { kind: 'warning'; message: string } | { kind: 'outcome'; outcome: SceneAOutcome };

const ROCK_HITS = '岩は女の子に当たってしまった……。';
const REGRET = '黒い言葉「後悔」を手に入れた。';

function base(): SceneAOutcome {
  return {
    log: [],
    girl: 'hurt',
    treeBurned: false,
    streamFrozen: false,
    wallStands: false,
    impStunned: false,
    gainRegret: false,
    discoveries: [],
  };
}

function hurt(outcome: SceneAOutcome, ...lines: string[]): SceneAOutcome {
  outcome.log.push(...lines, ROCK_HITS, REGRET);
  outcome.girl = 'hurt';
  outcome.gainRegret = true;
  return outcome;
}

function defaultTarget(spell: Spell): TargetId {
  if (spell.shapes.includes('wall')) return 'girl';
  if (spell.supports.length > 0 && !isAttack(spell)) return 'girl';
  return 'rock';
}

/**
 * 呪文の結果を決める。
 * 人に攻撃しようとしたとき、warned が false なら警告を返す（まだ唱えていない扱い）。
 */
export function resolveSceneA(spell: Spell, warned: boolean): SceneAResult {
  const o = base();
  if (isEmpty(spell)) {
    return { kind: 'outcome', outcome: hurt(o, '呪文は何も起こさなかった。') };
  }
  const target = spell.target ?? defaultTarget(spell);

  switch (target) {
    case 'girl': {
      if (spell.supports.includes('boost')) {
        if (spell.elements.length > 0) {
          o.girl = 'overcharged';
          o.log.push('女の子に力があふれ、拳ひとつで岩を粉々にした！', '……でも、目がぐるぐる回っている。');
          o.discoveries.push('強化＋属性×女の子：力があふれて暴走する');
        } else {
          o.girl = 'powered';
          o.log.push('女の子は強くなり、自分で岩を砕いた！', '「すごい！ありがとう！」');
          o.discoveries.push('強化×女の子：岩を砕けるほど強くなる');
        }
        return { kind: 'outcome', outcome: o };
      }
      if (spell.shapes.includes('wall')) {
        return { kind: 'outcome', outcome: walled(o) };
      }
      if (isAttack(spell)) {
        if (!warned) {
          return { kind: 'warning', message: '女の子に向けて攻撃の呪文を唱えようとしている。本当に唱える？' };
        }
        o.girl = 'angry';
        o.impStunned = true;
        o.gainRegret = true;
        o.log.push(
          '呪文は女の子をかすめた。「なにするの！」',
          '女の子は怒って帰ってしまった。岩はその後ろに落ちた。',
          '崖の上で誰かが大笑いしている。',
          REGRET,
        );
        o.discoveries.push('攻撃×人：怒って帰ってしまう');
        return { kind: 'outcome', outcome: o };
      }
      if (spell.supports.includes('heal')) {
        o.girl = 'dazed';
        o.log.push('岩は女の子に当たった。', 'でも癒しの光のおかげで、たんこぶだけで済んだ。');
        o.discoveries.push('癒し×女の子：ケガを軽くする');
        return { kind: 'outcome', outcome: o };
      }
      return { kind: 'outcome', outcome: hurt(o, '女の子に呪文は届いたが、何も起きなかった。') };
    }
    case 'rock': {
      if (spell.shapes.includes('wall')) {
        return { kind: 'outcome', outcome: walled(o) };
      }
      if (spell.supports.includes('boost') && !isAttack(spell)) {
        o.discoveries.push('強化×岩：岩が大きくなる');
        return { kind: 'outcome', outcome: hurt(o, '岩が……ひとまわり大きくなった。') };
      }
      if (spell.shapes.includes('chain') && spell.shapes.every((s) => s === 'chain')) {
        o.girl = 'grateful';
        o.log.push('鎖が岩を空中でつなぎとめた！', '女の子はその下をくぐって駆け寄ってきた。「ありがとう！」');
        o.discoveries.push('鎖×岩：空中で止める');
        return { kind: 'outcome', outcome: o };
      }
      if (isAttack(spell)) {
        o.girl = 'grateful';
        o.log.push('呪文が岩を砕いた！', '「ありがとう！ わたしも手伝う！」');
        o.discoveries.push('攻撃×岩：砕ける');
        return { kind: 'outcome', outcome: o };
      }
      return { kind: 'outcome', outcome: hurt(o, '岩に呪文は届いたが、何も起きなかった。') };
    }
    case 'tree': {
      if (spell.elements.includes('fire')) {
        o.treeBurned = true;
        o.discoveries.push('炎×枯れ木：燃えて煙が出る');
        return {
          kind: 'outcome',
          outcome: hurt(o, '枯れ木が燃え上がり、煙が崖の上へ流れていく。', '崖の上で小鬼がむせている！'),
        };
      }
      return { kind: 'outcome', outcome: hurt(o, '枯れ木は少しゆれただけだった。') };
    }
    case 'stream': {
      if (spell.elements.includes('ice')) {
        o.streamFrozen = true;
        o.girl = 'escaped';
        o.log.push('小川が一瞬で凍りついた。', '女の子は足をすべらせ、つるーっと岩の下から滑り出た！', '岩は誰もいない地面に落ちた。');
        o.discoveries.push('氷×小川：凍って滑る地面になる');
        return { kind: 'outcome', outcome: o };
      }
      if (spell.elements.includes('thunder')) {
        o.discoveries.push('雷×小川：水がしびれる（水の中にいるものに効く）');
        return { kind: 'outcome', outcome: hurt(o, '小川がバチバチと光った。でも誰も水に入っていない。') };
      }
      return { kind: 'outcome', outcome: hurt(o, '小川に呪文が落ちたが、何も起きなかった。') };
    }
    case 'imp':
      return { kind: 'outcome', outcome: hurt(o, '小鬼……？ どこにいるのだろう。') };
    case 'self':
      return { kind: 'outcome', outcome: hurt(o, '自分に呪文をかけている間に──') };
  }
}

function walled(o: SceneAOutcome): SceneAOutcome {
  o.girl = 'walled';
  o.wallStands = true;
  o.log.push('壁が立ち上がり、岩を受け止めた！', '女の子は壁の陰でほっとしている。');
  o.discoveries.push('壁×落石：防ぐ');
  return o;
}
