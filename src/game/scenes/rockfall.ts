// 女の子と落石：女の子の頭上に岩が落ちてくる。次は必ず「いたずら小鬼」

import { isAttack, isEmpty, type Spell } from '../parse';
import { emptyOutcome, outcome, REGRET_LINE, type Outcome, type SceneDef } from '../scene';
import type { TargetId } from '../words';

const ROCK_HITS = '岩は女の子に当たってしまった……。';
const HEAL_LINE = '「おばあちゃんに習ったの」と、癒しの言葉を教えてくれた。';
const ROCK_PIECES = '砕けた岩のかけらが、ぱらぱらと降ってきた。';
const BREAD = '女の子がお礼にパンをくれた。ハートが1つ増えた。';

function hurt(o: Outcome, ...lines: string[]): Outcome {
  o.log.push(...lines, ROCK_HITS, REGRET_LINE);
  o.flags.girl = 'hurt';
  o.gainRegret = true;
  o.summary = '女の子を助けられなかった';
  return o;
}

function walled(o: Outcome): Outcome {
  o.flags.girl = 'walled';
  o.flags.wallStands = true;
  o.log.push('壁が立ち上がり、岩を受け止めた！', '女の子は壁の陰でほっとしている。');
  o.discoveries.push('壁×落石：防ぐ');
  o.summary = '壁で女の子を守った';
  o.log.push(HEAL_LINE);
  o.reward = 'heal';
  return o;
}

function saved(o: Outcome, summary: string, ...lines: string[]): Outcome {
  o.log.push(...lines, BREAD, HEAL_LINE);
  o.hearts += 1;
  o.summary = summary;
  o.reward = 'heal';
  return o;
}

function defaultTarget(spell: Spell): TargetId {
  if (spell.shapes.includes('wall')) return 'girl';
  if (spell.supports.length > 0 && !isAttack(spell)) return 'girl';
  return 'rock';
}

export const rockfall: SceneDef = {
  id: 'rockfall',
  title: '崖下の小道',
  kind: 'event',
  intro: () => ['崖下の小道を歩いていると、頭上でガラッと音がした。', '女の子の真上に、岩が落ちてくる！'],
  objects: () => [
    { id: 'rock', label: '🪨 落ちてくる岩', keyword: '岩', desc: '女の子の真上に落ちてくる！', color: '#c9b9a0' },
    { id: 'girl', label: '👧 女の子', keyword: '女の子', desc: '近くの村の子どもらしい。', color: '#f3c6c6' },
    { id: 'tree', label: '🌳 枯れ木', keyword: '枯れ木', desc: 'からからに乾いている。', color: '#cfe0b8' },
    { id: 'stream', label: '🏞️ 小川', keyword: '小川', desc: '浅い小川が流れている。', color: '#bfe0f0' },
  ],
  resolve(spell, ctx) {
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(hurt(o, '呪文は何も起こさなかった。'));
    const target = spell.target ?? defaultTarget(spell);

    switch (target) {
      case 'girl': {
        if (spell.supports.includes('boost')) {
          if (spell.elements.length > 0) {
            o.flags.girl = 'overcharged';
            o.gainWords.push('gravel');
            o.log.push(ROCK_PIECES);
            o.log.push('女の子に力があふれ、拳ひとつで岩を粉々にした！', '……でも、目がぐるぐる回っている。');
            o.discoveries.push('強化＋属性×女の子：力があふれて暴走する');
            o.summary = '女の子を強化しすぎた';
            return outcome(o);
          }
          o.flags.girl = 'powered';
          o.gainWords.push('gravel');
          o.log.push(ROCK_PIECES);
          o.discoveries.push('強化×女の子：岩を砕けるほど強くなる');
          return outcome(saved(o, '女の子を強化して岩を砕かせた', '女の子は強くなり、自分で岩を砕いた！'));
        }
        if (spell.shapes.includes('wall')) return outcome(walled(o));
        if (isAttack(spell)) {
          if (!ctx.warned) {
            return { kind: 'warning', message: '女の子に向けて攻撃の呪文を唱えようとしている。本当に唱える？' };
          }
          o.flags.girl = 'angry';
          o.flags.impStunned = true;
          o.gainRegret = true;
          o.hearts -= 1;
          o.log.push(
            '呪文は女の子をかすめた。「なにするの！」',
            '女の子は石を投げ返して帰ってしまった。ハートを1つ失った。',
            '崖の上で誰かが大笑いしている。',
            REGRET_LINE,
          );
          o.discoveries.push('攻撃×人：怒って帰ってしまう');
          o.summary = '女の子を攻撃して怒らせた';
          return outcome(o);
        }
        if (spell.supports.includes('heal')) {
          o.flags.girl = 'dazed';
          o.log.push('岩は女の子に当たった。', 'でも癒しの光のおかげで、たんこぶだけで済んだ。');
          o.discoveries.push('癒し×女の子：ケガを軽くする');
          o.summary = '癒しで女の子のケガを軽くした';
          return outcome(o);
        }
        return outcome(hurt(o, '女の子に呪文は届いたが、何も起きなかった。'));
      }
      case 'rock': {
        if (spell.shapes.includes('wall')) return outcome(walled(o));
        if (spell.supports.includes('boost') && !isAttack(spell)) {
          o.discoveries.push('強化×岩：岩が大きくなる');
          return outcome(hurt(o, '岩が……ひとまわり大きくなった。'));
        }
        if (spell.shapes.length > 0 && spell.shapes.every((s) => s === 'chain')) {
          o.flags.girl = 'grateful';
          o.discoveries.push('鎖×岩：空中で止める');
          return outcome(saved(o, '鎖で岩を止めた', '鎖が岩を空中でつなぎとめた！', '女の子はその下をくぐって駆け寄ってきた。'));
        }
        if (isAttack(spell)) {
          o.flags.girl = 'grateful';
          o.discoveries.push('攻撃×岩：砕ける');
          o.gainWords.push('gravel');
          o.log.push(ROCK_PIECES);
          return outcome(saved(o, '岩を砕いて女の子を助けた', '呪文が岩を砕いた！', '「ありがとう！ わたしも手伝う！」'));
        }
        return outcome(hurt(o, '岩に呪文は届いたが、何も起きなかった。'));
      }
      case 'tree': {
        if (spell.elements.includes('fire')) {
          o.flags.treeBurned = true;
          o.gainWords.push('smoke');
          o.discoveries.push('炎×枯れ木：燃えて煙が出る');
          return outcome(hurt(o, '枯れ木が燃え上がり、煙が崖の上へ流れていく。', '崖の上で小鬼がむせている！'));
        }
        return outcome(hurt(o, '枯れ木は少しゆれただけだった。'));
      }
      case 'stream': {
        if (spell.elements.includes('ice')) {
          o.flags.streamFrozen = true;
          o.flags.girl = 'escaped';
          o.gainWords.push('frost');
          o.log.push('小川が一瞬で凍りついた。', '女の子は足をすべらせ、つるーっと岩の下から滑り出た！', '岩は誰もいない地面に落ちた。');
          o.discoveries.push('氷×小川：凍って滑る地面になる');
          o.summary = '小川を凍らせて女の子を滑らせた';
          o.log.push(HEAL_LINE);
          o.reward = 'heal';
          return outcome(o);
        }
        if (spell.elements.includes('thunder')) {
          o.discoveries.push('雷×小川：水がしびれる（水の中にいるものに効く）');
          return outcome(hurt(o, '小川がバチバチと光った。でも誰も水に入っていない。'));
        }
        return outcome(hurt(o, '小川に呪文が落ちたが、何も起きなかった。'));
      }
      case 'imp':
      case 'enemy':
        return outcome(hurt(o, '敵……？ どこにいるのだろう。'));
      case 'self':
        return outcome(hurt(o, '自分に呪文をかけている間に──'));
      default:
        return outcome(hurt(o, 'それはここにはない。'));
    }
  },
};
