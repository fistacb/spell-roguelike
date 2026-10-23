// 道をふさぐ熊：細い山道の真ん中で、大きな熊が眠っている

import { isAttack, isEmpty } from '../parse';
import { emptyOutcome, fight, outcome, type Enemy, type Outcome, type SceneDef } from '../scene';

const BEAR: Enemy = { name: '熊', targets: ['bear'], toughness: 12, chainable: true };

function passed(o: Outcome, summary: string, discovery: string, ...lines: string[]): Outcome {
  o.log.push(...lines);
  o.discoveries.push(discovery);
  o.summary = summary;
  return o;
}

export const bear: SceneDef = {
  id: 'bear',
  title: '道をふさぐ熊',
  kind: 'event',
  intents: [
    { name: '土の爪', element: 'earth', hearts: 2, inWater: false, description: '眠っている。起こすと爪で襲ってくる' },
  ],
  intro: () => ['細い山道の真ん中で、大きな熊がいびきをかいている。', 'そばの大木には、蜂の巣がぶら下がっている。'],
  objects: () => [
    { id: 'bear', label: '🐻 眠る熊', keyword: '熊', desc: 'ぐっすり眠っている。とても強そう。', color: '#d6b89a' },
    { id: 'hive', label: '🍯 蜂の巣', keyword: '蜂の巣', desc: '蜜がたっぷり詰まっていそう。', color: '#f2d27a' },
    { id: 'tree', label: '🌲 大木', keyword: '大木', desc: '道のわきに立つ大きな木。', color: '#cfe0b8' },
  ],
  resolve(spell, ctx) {
    const o = emptyOutcome();
    if (isEmpty(spell)) {
      o.hearts -= 1;
      o.log.push('そっと通り抜けようとしたが、熊が目を覚ました！', '爪がかすめて、ハートを1つ失った。');
      o.summary = '熊に引っかかれた';
      return outcome(o);
    }
    const target = spell.target ?? (isAttack(spell) ? 'bear' : 'self');

    switch (target) {
      case 'hive':
        if (spell.elements.includes('fire')) {
          o.hearts -= 1;
          o.log.push('蜂の巣が燃えて、怒った蜂が飛び出してきた！ ハートを1つ失った。', '熊も驚いて逃げていった。');
          o.discoveries.push('炎×蜂の巣：蜂が怒って襲ってくる');
          o.summary = '蜂に刺された';
          return outcome(o);
        }
        if (isAttack(spell)) {
          return outcome(passed(o, '蜂の巣で熊の気をそらした', '攻撃×蜂の巣：落ちた蜜で熊の気がそれる',
            '蜂の巣がぽとりと落ちた。', '熊は目を覚まし、蜜に夢中になっている。その間に通り抜けた。'));
        }
        o.log.push('蜂の巣はゆれただけだった。');
        return outcome(passedQuietly(o));
      case 'tree':
        if (spell.shapes.some((s) => s === 'blade' || s === 'spear') || spell.elements.includes('thunder')) {
          return outcome(passed(o, '大木を倒して別の道を作った', '刃・雷×大木：倒れて別の道ができる',
            '大木が谷側に倒れて、丸太の橋になった。', '熊を起こさずに、丸太を渡って先へ進んだ。'));
        }
        o.log.push('大木はびくともしない。');
        return outcome(passedQuietly(o));
      case 'bear':
      case 'enemy':
        if (spell.supports.includes('heal') && !isAttack(spell)) {
          return outcome(passed(o, '熊を癒してぐっすり眠らせた', '癒し×熊：ますますぐっすり眠る',
            '熊は気持ちよさそうに寝返りをうった。', 'いびきがますます大きくなり、そっと通り抜けられた。'));
        }
        if (spell.supports.includes('boost') && !isAttack(spell)) {
          o.hearts -= 2;
          o.log.push('熊がむくりと起き上がった。……ひとまわり大きくなって。', '大きな爪になぎ払われ、ハートを2つ失った。');
          o.discoveries.push('強化×熊：強くなって目を覚ます');
          o.summary = '熊を強化してしまった';
          return outcome(o);
        }
        if (spell.shapes.includes('chain') && spell.shapes.every((s) => s === 'chain')) {
          return outcome(passed(o, '眠る熊を鎖で縛って通った', '鎖×眠る熊：縛って安全に通れる',
            '鎖が眠る熊をぐるぐる巻きにした。', '熊は寝たまま。ゆうゆうと通り抜けた。'));
        }
        if (isAttack(spell)) {
          o.log.push('熊が目を覚ました！');
          const r = fight(spell, { enemy: BEAR, intent: ctx.intent! });
          o.log.push(...r.log);
          o.hearts += r.hearts;
          o.discoveries.push(...r.discoveries);
          o.summary = r.defeated ? '熊を追い払った' : '熊に襲われた';
          if (!r.defeated) o.log.push('熊はひとしきり暴れて、森の奥へ帰っていった。');
          return outcome(o);
        }
        o.log.push('熊の鼻がぴくりと動いた。');
        return outcome(passedQuietly(o));
      default:
        if (spell.shapes.includes('wall')) {
          return outcome(passed(o, '壁に隠れて熊の横を通った', '壁×眠る熊：陰に隠れて通れる',
            '壁を立てて、その陰をそろりそろりと進んだ。', '熊は気づかなかった。'));
        }
        if (spell.supports.includes('heal')) {
          o.hearts += 1;
          o.log.push('自分を癒した。ハートが1つ増えた。');
        }
        return outcome(passedQuietly(o));
    }
  },
};

// 何も起きなかったときは、そっと通ろうとして見つかる
function passedQuietly(o: Outcome): Outcome {
  o.hearts -= 1;
  o.log.push('そっと通り抜けようとしたが、熊が目を覚ました！', '爪がかすめて、ハートを1つ失った。');
  o.summary = '熊に引っかかれた';
  return o;
}
