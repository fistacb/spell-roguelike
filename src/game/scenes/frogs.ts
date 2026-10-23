// カエルの合唱：池のカエルの群れが、縄張りに入った旅人に跳びかかってくる

import { emptyOutcome, absorb, fight, outcome, spellMultiplier, type Enemy, type SceneDef } from '../scene';

// 群れなので雨がよく効くが、水が好きで雨では元気になってしまう
const FROGS: Enemy = { name: 'カエルの群れ', targets: ['frog'], toughness: 10, chainable: false, shapeMult: { rain: 1, spear: 0.5 } };

export const frogs: SceneDef = {
  id: 'frogs',
  title: 'カエルの合唱',
  kind: 'battle',
  intents: [
    { name: '水鉄砲', element: 'ice', hearts: 1, inWater: true, description: '池の中から、冷たい水を吹きかけようとしている' },
    { name: '一斉ジャンプ', element: 'earth', hearts: 2, inWater: false, charge: true, description: '岸に上がって、一斉に跳びかかろうとしている' },
  ],
  intro: () => ['池のほとりを通りかかると、ゲコゲコと大合唱が始まった。', '大きなカエルの群れが、こちらをにらんでいる！'],
  objects: () => [
    { id: 'frog', label: '🐸 カエルの群れ', keyword: 'カエル', desc: '20匹はいる。雨の日は元気らしい。', color: '#bfe5b0' },
    { id: 'pond', label: '🪷 池', keyword: '池', desc: 'カエルたちのすみか。', color: '#bfe0f0' },
    { id: 'lily', label: '🍃 蓮の葉', keyword: '蓮の葉', desc: '大きな葉が池いっぱいに浮かんでいる。', color: '#cfe0b8' },
  ],
  resolve(spell, ctx) {
    const intent = ctx.intent!;
    const o = emptyOutcome();
    let bonus = 0;
    let noAttack: string | undefined;

    if (spell.shapes.includes('rain') && !spell.elements.includes('thunder') && !spell.elements.includes('ice') && !spell.pure) {
      o.log.push('雨を浴びて、カエルたちはますます元気になった！');
      o.discoveries.push('雨×カエル：元気になってしまう');
    }
    if (spell.target === 'pond' && spell.elements.includes('thunder')) {
      if (intent.inWater) {
        bonus += Math.ceil(12 * spellMultiplier(spell));
        o.log.push('池に雷が走り、水の中のカエルたちがまとめてしびれた！');
        o.discoveries.push('雷×池：水の中のカエルがまとめてしびれる');
      } else {
        o.log.push('池がバチバチと光った。でもカエルたちはもう岸に上がっている。');
      }
    }
    if ((spell.target === 'pond' || spell.target === 'lily') && (spell.elements.includes('ice') || spell.tricks.includes('frost'))) {
      o.gainWords.push('frost');
      if (intent.inWater) {
        noAttack = '✦ 池が凍りついて、カエルたちは氷の中で動けなくなった。';
        o.discoveries.push('氷×池：水の中のカエルが動けなくなる');
      } else {
        o.log.push('池が凍りついた。でもカエルたちはもう岸の上だ。');
      }
    }
    if (spell.target === 'lily' && spell.elements.includes('fire')) {
      o.log.push('蓮の葉がしおれて、カエルたちの足場がなくなった。');
      o.discoveries.push('炎×蓮の葉：足場がなくなってカエルが弱る');
      bonus += 4;
    }

    const thunder = spell.elements.includes('thunder') && intent.inWater && spell.target !== 'pond';
    const r = fight(spell, {
      enemy: FROGS,
      intent,
      bonusDamage: bonus,
      extraMult: thunder ? { mult: 2, line: '池の中のカエルたちに雷がよく通った！' } : undefined,
      noAttack,
    });
    absorb(o, r);
    if (r.slept) {
      o.summary = 'カエルを眠らせて通り抜けた';
      return outcome(o);
    }
    if (r.defeated) {
      o.log.push('カエルたちはぴょんぴょんと池の奥へ逃げていった。');
      o.summary = 'カエルの群れを追い払った';
    } else {
      o.log.push('合唱に追い立てられるように、池のほとりを走り抜けた。');
      o.summary = 'カエルに追い立てられた';
    }
    return outcome(o);
  },
};
