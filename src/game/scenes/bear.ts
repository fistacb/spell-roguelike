// 道をふさぐ熊：細い山道の真ん中で、大きな熊が眠っている

import { isAttack, isEmpty } from '../parse';
import { absorb, emptyOutcome, fight, outcome, type Enemy, type Outcome, type SceneDef } from '../scene';

const BEAR: Enemy = { name: '熊', targets: ['bear'], toughness: 12, chainable: true };

function passed(o: Outcome, summary: string, discovery: string, ...lines: string[]): Outcome {
  o.log.push(...lines, '熊のいた森の土を、ひとつかみ持っていくことにした。');
  o.discoveries.push(discovery);
  o.summary = summary;
  o.reward = 'earth';
  return o;
}

export const bear: SceneDef = {
  id: 'bear',
  title: '道をふさぐ熊',
  kind: 'event',
  intents: [
    { name: '土の爪', element: 'earth', hearts: 2, inWater: false, charge: true, description: '眠っている。起こすと爪で襲ってくる' },
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
    if (spell.supports.includes('echo')) {
      o.log.push('呪文が山に大きく響きわたった。', '熊が飛び起きた！');
      o.discoveries.push('響き×眠る熊：大きな音で起きてしまう');
      const r = fight(spell, { enemy: BEAR, intent: ctx.intent! });
      absorb(o, r);
      o.summary = r.defeated ? '熊を追い払った' : r.hid ? '灰にまぎれて起きた熊から逃れた' : '響きで熊を起こしてしまった';
      return outcome(o);
    }
    if (target === 'hive' && spell.supports.includes('pull')) {
      o.hearts -= 2;
      o.log.push('蜂の巣が手もとに飛んできた。……甘い匂いにつられて、熊もついてきた！', '蜜ごと押し倒されて、ハートを2つ失った。');
      o.discoveries.push('引き寄せ×蜂の巣：熊までついてくる');
      o.summary = '熊に蜜ごと押し倒された';
      return outcome(o);
    }
    if (spell.tricks.includes('quiet') && !(isAttack(spell) && (target === 'bear' || target === 'enemy'))) {
      return outcome(passed(o, '静けさの中で熊の横を通った', '静けさ×眠る熊：何をしても起きない',
        '✦ あたりがしんと静まりかえった。', '足音ひとつ立てずに、熊の横を通り抜けた。'));
    }
    if (spell.tricks.includes('ash') && !isAttack(spell)) {
      return outcome(passed(o, '灰で匂いを消して熊の横を通った', '灰×眠る熊：匂いを消して通れる',
        '✦ 灰をまとって、自分の匂いを消した。', '熊の鼻はぴくりとも動かなかった。'));
    }
    if ((target === 'bear' || target === 'self') && spell.supports.includes('sleep') && !isAttack(spell)) {
      o.gainWords.push('quiet');
      return outcome(passed(o, '熊をもっと深く眠らせて通った', '眠り×眠る熊：ますます深く眠る',
        '✦ 熊のいびきが、さらに深くなった。', 'もう何があっても起きそうにない。'));
    }
    if (spell.tricks.includes('smoke') && !isAttack(spell) && target !== 'hive' && target !== 'tree') {
      return outcome(passed(o, '煙にまぎれて熊の横を通った', '煙×眠る熊：煙にまぎれて通れる',
        '煙があたりに立ちこめた。', 'その中を、熊に気づかれずに通り抜けた。'));
    }

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
          absorb(o, r);
          if (r.slept) {
            o.summary = '熊を眠らせて通り抜けた';
            return outcome(o);
          }
          if (r.hid) {
            o.summary = '灰にまぎれて熊から逃れた';
            return outcome(o);
          }
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
