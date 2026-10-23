// 大ナマズ：川沿いの道で、川の主の大ナマズが暴れている

import { absorb, emptyOutcome, fight, outcome, type Enemy, type SceneDef } from '../scene';

// ぬるぬるして鎖は効かない。水の中なので雷がよく通る
const CATFISH: Enemy = { name: '大ナマズ', targets: ['catfish'], toughness: 9, chainable: false };

const THANKS = '漁師たちが「主を静めてくれた」と喜び、焼き魚をふるまってくれた。ハートが1つ増えた。';

export const catfish: SceneDef = {
  id: 'catfish',
  title: '川の主',
  kind: 'battle',
  intents: [
    { name: '尾びれの水しぶき', element: 'ice', hearts: 1, inWater: true, description: '川の中で尾びれを振り上げている' },
    { name: '大口で丸のみ', element: 'earth', hearts: 2, inWater: false, charge: true, description: '岸に乗り上げて、大口を開けて迫ってくる' },
  ],
  intro: () => ['川沿いの道で、漁師たちが逃げてくる。', '漁師「川の主の大ナマズが暴れてるんだ！」 水面が大きく盛り上がった。'],
  objects: () => [
    { id: 'catfish', label: '🐟 大ナマズ', keyword: 'ナマズ', desc: 'ぬるぬるで、鎖もすべり落ちそう。水の中にいると強気だ。', color: '#c7cbd6' },
    { id: 'stream', label: '🌊 川', keyword: '川', desc: '流れは速くない。水の中なら、しびれるものがよく通りそう。', color: '#bfe0f0' },
    { id: 'riverbed', label: '🪨 岸辺の岩', keyword: '岸', desc: 'ナマズが乗り上げてきそうな、平たい岩。', color: '#c9b9a0' },
  ],
  resolve(spell, ctx) {
    const intent = ctx.intent!;
    const o = emptyOutcome();
    let bonus = 0;
    let noAttack: string | undefined;
    if (spell.target === 'stream' && spell.elements.includes('thunder')) {
      if (intent.inWater) {
        bonus += 12;
        o.log.push('川に雷が走り、水の中の大ナマズがびりびりとしびれた！');
        o.discoveries.push('雷×川：水の中のナマズがしびれる');
      } else {
        o.log.push('川がバチバチと光った。でもナマズはもう岸の上だ。');
      }
    }
    if (spell.target === 'riverbed' && (spell.shapes.includes('wall') || spell.elements.includes('earth'))) {
      if (intent.charge) {
        noAttack = '岸に壁が立ち、乗り上げてきたナマズは頭をぶつけて川へ戻っていった。';
        o.discoveries.push('壁・土×岸：乗り上げてくるナマズを止める');
      } else {
        o.log.push('岸に壁が立った。でもナマズは川の中から水しぶきを飛ばしてくる。');
      }
    }
    const thunder = spell.elements.includes('thunder') && intent.inWater && spell.target !== 'stream';
    const r = fight({ ...spell, target: spell.target === 'stream' || spell.target === 'riverbed' ? 'catfish' : spell.target }, {
      enemy: CATFISH,
      intent,
      bonusDamage: bonus,
      extraMult: thunder ? { mult: 2, line: '水の中の大ナマズに雷がよく通った！' } : undefined,
      noAttack,
    });
    if (thunder) o.discoveries.push('雷×水の中の敵：よく通って2倍');
    absorb(o, r);
    if (r.slept) {
      o.summary = '大ナマズを眠らせて通り抜けた';
      return outcome(o);
    }
    if (r.hid) {
      o.summary = '灰にまぎれて大ナマズから逃れた';
      return outcome(o);
    }
    if (r.defeated) {
      o.hearts += 1;
      o.log.push(THANKS);
      o.summary = '川の主を静めた';
    } else {
      o.log.push('大ナマズが川底に潜っている間に、急いで先へ進んだ。');
      o.summary = '川の主から逃げた';
    }
    return outcome(o);
  },
};
