// 沼のスライム：ぬかるんだ沼地で、大きなスライムが道をふさいでいる

import { absorb, emptyOutcome, fight, outcome, spellMultiplier, type Enemy, type SceneDef } from '../scene';

// ぷにぷにしているので、槍や刃では手ごたえがない
const BLADE_LINE = '沼の底で、錆びない刃が光っていた。';

const SLIME: Enemy = { name: 'スライム', targets: ['slime'], toughness: 8, chainable: false, shapeMult: { spear: 0.5, blade: 0.5 } };

export const slime: SceneDef = {
  id: 'slime',
  title: '沼のスライム',
  kind: 'battle',
  intents: [
    { name: '泥はね', element: 'earth', hearts: 1, inWater: false, description: '体をふるわせて泥を飛ばそうとしている' },
    { name: '冷たいのしかかり', element: 'ice', hearts: 2, inWater: false, charge: true, description: 'ふくらんでのしかかろうとしている' },
  ],
  intro: () => ['ぬかるんだ沼地に出た。', '沼の真ん中で、大きなスライムがぷるぷるしている！'],
  objects: () => [
    { id: 'slime', label: '🟢 スライム', keyword: 'スライム', desc: '沼の水を吸ってふくらんでいる。槍や刃は効きにくそう。', color: '#bfe5b0' },
    { id: 'swamp', label: '🟫 沼', keyword: '沼', desc: 'スライムはこの水につかっている。', color: '#c9c0a3' },
    { id: 'grass', label: '🌾 枯れ草', keyword: '枯れ草', desc: '沼のまわりを囲むように生えている。', color: '#e6d89c' },
  ],
  resolve(spell, ctx) {
    const intent = ctx.intent!;
    const o = emptyOutcome();

    if ((spell.target === 'swamp' || spell.shapes.includes('rain')) && spell.elements.includes('ice')) {
      o.log.push('沼がスライムごと凍りついた！', 'スライムはかちこちになって動けない。');
      o.discoveries.push('氷×沼：スライムごと凍らせて動けなくする');
      o.summary = 'スライムを沼ごと凍らせた';
      o.gainWords.push('frost');
      o.log.push(BLADE_LINE);
      o.reward = 'blade';
      return outcome(o);
    }

    if (spell.supports.includes('flow') && (spell.target === 'slime' || spell.target === 'swamp' || spell.target === 'enemy' || spell.target === null)) {
      o.log.push('✦ 沼の水が流れを作り、スライムごと下流へ運んでいった！');
      o.discoveries.push('流れ×沼：スライムごと押し流す');
      o.summary = 'スライムを沼の水ごと押し流した';
      o.log.push(BLADE_LINE);
      o.reward = 'blade';
      return outcome(o);
    }

    let bonus = 0;
    let toughnessDown = 0;
    if (spell.target === 'swamp' && spell.elements.includes('thunder')) {
      bonus += Math.ceil(10 * spellMultiplier(spell));
      o.log.push('沼に雷が走り、スライムが感電した！');
      o.discoveries.push('雷×沼：つかっているスライムが感電する');
    }
    if ((spell.target === 'grass' || spell.shapes.includes('rain')) && spell.elements.includes('fire')) {
      toughnessDown += 4;
      o.gainWords.push('smoke');
      o.log.push('枯れ草が燃え上がり、熱で沼の水がぐつぐつ干上がっていく。', 'スライムがしぼんでいく！');
      o.discoveries.push('炎×枯れ草：沼が干上がってスライムがしぼむ');
    }
    if (spell.shapes.includes('chain') && (spell.target === 'slime' || spell.target === 'enemy' || spell.target === null)) {
      o.log.push('鎖はぬるりとすり抜けた。');
    }
    if (spell.shapes.some((s) => s === 'spear' || s === 'blade') && (spell.target === 'slime' || spell.target === 'enemy' || spell.target === null)) {
      o.discoveries.push('槍・刃×スライム：手ごたえがない');
    }

    const thunderOnSlime = spell.elements.includes('thunder') && spell.target !== 'swamp';
    const r = fight(spell, {
      enemy: SLIME,
      intent,
      toughnessDown,
      bonusDamage: bonus,
      extraMult: thunderOnSlime ? { mult: 2, line: '水を吸ったスライムに雷がよく通った！' } : undefined,
    });
    if (thunderOnSlime) o.discoveries.push('雷×スライム：水を吸っていて2倍効く');
    absorb(o, r);
    if (r.slept) {
      o.summary = 'スライムを眠らせて通り抜けた';
      return outcome(o);
    }
    o.summary = r.defeated ? 'スライムを追い払った' : 'スライムに泥だらけにされた';
    if (!r.defeated) o.log.push('スライムが沼に沈んだすきに、なんとか向こう岸へ渡った。');
    else {
      o.log.push(BLADE_LINE);
      o.reward = 'blade';
    }
    return outcome(o);
  },
};
