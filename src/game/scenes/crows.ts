// 畑のカラス：村の麦畑がカラスの群れに荒らされている

import { isAttack } from '../parse';
import { absorb, emptyOutcome, fight, outcome, REGRET_LINE, type Enemy, type SceneDef } from '../scene';

// 群れなので、雨はよく効き、槍は1羽にしか当たらない
const CROWS: Enemy = { name: 'カラスの群れ', targets: ['crow'], toughness: 8, chainable: false, shapeMult: { rain: 2, spear: 0.5 } };

const THANKS = '畑の持ち主のおばあさんが、お礼にパンをくれた。ハートが1つ増えた。';

export const crows: SceneDef = {
  id: 'crows',
  title: '畑のカラス',
  kind: 'battle',
  intents: [
    { name: '急降下', element: 'wind', hearts: 1, inWater: false, description: '空から急降下してつつこうとしている' },
    { name: '群れの体当たり', element: 'earth', hearts: 1, inWater: false, charge: true, description: '低く飛んで一斉にぶつかってこようとしている' },
  ],
  intro: () => ['村の麦畑で、カラスの群れが麦をついばんでいる。', 'おばあさん「あれまあ、だれか追い払っておくれ！」'],
  objects: () => [
    { id: 'crow', label: '🐦‍⬛ カラスの群れ', keyword: 'カラス', desc: '10羽はいる。1羽ずつ狙っても逃げられそう。', color: '#c7cbd6' },
    { id: 'scarecrow', label: '🧑‍🌾 かかし', keyword: 'かかし', desc: 'ぼろぼろで、カラスに馬鹿にされている。', color: '#e6d89c' },
    { id: 'field', label: '🌾 麦畑', keyword: '麦畑', desc: '収穫まであと少し。', color: '#f0e2a8' },
  ],
  resolve(spell, ctx) {
    const intent = ctx.intent!;
    const o = emptyOutcome();

    if (spell.target === 'field' && spell.elements.includes('fire')) {
      o.gainRegret = true;
      o.gainWords.push('smoke');
      o.log.push('麦畑が燃え上がり、カラスは逃げていった。', 'おばあさんはその場に座りこんでしまった……。', REGRET_LINE);
      o.discoveries.push('炎×麦畑：カラスは逃げるが畑も燃える');
      o.summary = '麦畑を燃やしてしまった';
      return outcome(o);
    }
    if (spell.target === 'scarecrow') {
      if (spell.supports.includes('boost')) {
        o.hearts += 1;
        o.log.push('かかしがむくりと動き出し、両手を振り回した！', 'カラスたちは大あわてで逃げていった。', THANKS);
        o.discoveries.push('強化×かかし：動き出してカラスを追い払う');
        o.summary = 'かかしを動かしてカラスを追い払った';
        return outcome(o);
      }
      if (spell.elements.includes('thunder')) {
        o.hearts += 1;
        o.log.push('かかしに雷が落ち、ドーンと大きな音がした！', 'カラスたちはびっくりして逃げていった。', THANKS);
        o.discoveries.push('雷×かかし：大きな音でカラスが逃げる');
        o.summary = 'かかしに雷を落としてカラスを驚かせた';
        return outcome(o);
      }
      if (spell.elements.includes('fire')) {
        o.log.push('かかしが燃えてしまった。カラスは気にも留めていない。');
        o.discoveries.push('炎×かかし：燃えるだけ');
      }
    }
    const atCrows = spell.target === null || spell.target === 'crow' || spell.target === 'enemy';
    if (atCrows && spell.elements.includes('wind')) {
      o.hearts += 1;
      o.log.push('✦ 強い向かい風が吹きつけた！ カラスたちは羽ばたいても前に進めない。', 'やがてあきらめて、森の方へ流されていった。', THANKS);
      o.discoveries.push('風×カラス：向かい風で飛べなくなる');
      o.summary = '向かい風でカラスを追い払った';
      return outcome(o);
    }
    if (spell.target === 'field' && spell.shapes.includes('wall') && !isAttack(spell)) {
      o.log.push('麦畑のまわりに壁が立った。カラスは麦に近づけない。');
      o.discoveries.push('壁×麦畑：カラスから畑を守る');
    }

    const r = fight(spell, { enemy: CROWS, intent });
    absorb(o, r);
    if (r.slept) {
      o.summary = 'カラスの群れを眠らせて通り抜けた';
      return outcome(o);
    }
    if (r.hid) {
      o.summary = '灰にまぎれてカラスの群れから逃れた';
      return outcome(o);
    }
    if (spell.shapes.includes('rain') && spell.target !== 'field') o.discoveries.push('雨×群れ：全員に当たってよく効く');
    if (r.defeated) {
      o.hearts += 1;
      o.log.push(THANKS);
      o.summary = 'カラスの群れを追い払った';
    } else {
      o.log.push('カラスたちは麦をくわえて、悠々と飛んでいった。');
      o.summary = 'カラスに麦を持っていかれた';
    }
    return outcome(o);
  },
};
