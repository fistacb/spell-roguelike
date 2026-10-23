// 岩山のゴーレム：山道をふさぐ土の大物。水や泥で崩れる

import { emptyOutcome, absorb, fight, outcome, type Enemy, type SceneDef } from '../scene';

// 岩の体は硬いが、水を吸うと崩れやすい
const GOLEM: Enemy = { name: 'ゴーレム', targets: ['golem'], toughness: 12, chainable: true, shapeMult: { rain: 2 } };

export const golem: SceneDef = {
  id: 'golem',
  title: '岩山のゴーレム',
  kind: 'battle',
  intents: [
    { name: '岩のこぶし', element: 'earth', hearts: 2, inWater: false, charge: true, description: 'ずしんずしんと近づいて、こぶしを振り下ろそうとしている' },
    { name: '石つぶて', element: 'earth', hearts: 1, inWater: false, description: '体の石をちぎって投げようとしている' },
  ],
  intro: () => ['山道の先で、岩がむくりと起き上がった。', '岩でできた大男、ゴーレムだ！ そばでは泉がこんこんと湧いている。'],
  objects: () => [
    { id: 'golem', label: '🗿 ゴーレム', keyword: 'ゴーレム', desc: '岩の体。とても硬そうだが、ひびから水がしみている。', color: '#c9b9a0' },
    { id: 'spring', label: '⛲ 泉', keyword: '泉', desc: '冷たい水がこんこんと湧いている。', color: '#bfe0f0' },
  ],
  resolve(spell, ctx) {
    const intent = ctx.intent!;
    const o = emptyOutcome();

    // 泉の水をゴーレムに浴びせると、体が崩れる
    if (spell.target === 'spring' && (spell.supports.includes('flow') || spell.supports.includes('boost'))) {
      o.log.push('✦ 泉から水があふれ出し、ゴーレムの足もとへ流れこんだ！', 'ゴーレムの体がぐずぐずと崩れていく。');
      o.discoveries.push('流れ・強化×泉：水でゴーレムが崩れる');
      o.gainWords.push('gravel');
      o.summary = 'ゴーレムを泉の水で崩した';
      o.log.push('崩れたゴーレムのかけらが、ざらざらと足もとに転がった。');
      return outcome(o);
    }
    let toughnessDown = 0;
    if (spell.target === 'spring' && spell.elements.includes('ice')) {
      o.log.push('泉が凍って、とがった氷のつららになった。');
      o.discoveries.push('氷×泉：つららになる（攻撃が鋭くなる？）');
      toughnessDown += 4;
    }
    if (spell.tricks.includes('mud')) {
      o.log.push('✦ 泥がゴーレムのひびに入りこみ、体がぼろぼろと崩れ出した！');
      toughnessDown += 6;
    }

    const r = fight({ ...spell, target: spell.target === 'spring' ? 'golem' : spell.target }, {
      enemy: GOLEM,
      intent,
      toughnessDown,
      extraMult: spell.elements.includes('ice') && spell.target !== 'spring' ? { mult: 1.5, line: '冷たさで、ゴーレムのひびが広がった！' } : undefined,
    });
    absorb(o, r);
    if (r.slept) {
      o.summary = 'ゴーレムを眠らせて通り抜けた';
      return outcome(o);
    }
    if (r.defeated) {
      o.gainWords.push('gravel');
      o.log.push('崩れたゴーレムのかけらが、ざらざらと足もとに転がった。');
      o.summary = 'ゴーレムを崩した';
    } else {
      o.log.push('ゴーレムが暴れている間に、脇の岩場をよじ登って先へ進んだ。');
      o.summary = 'ゴーレムから逃げ出した';
    }
    return outcome(o);
  },
};
