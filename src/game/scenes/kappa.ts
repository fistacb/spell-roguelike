// 河童の相撲：川岸で、河童が相撲を挑んでくる

import { absorb, emptyOutcome, fight, outcome, type Enemy, type SceneDef } from '../scene';

// 頭の皿が乾くと力が抜ける
const KAPPA: Enemy = { name: '河童', targets: ['kappa'], toughness: 8, chainable: true };

export const kappa: SceneDef = {
  id: 'kappa',
  title: '河童の相撲',
  kind: 'battle',
  intents: [
    { name: 'つっぱり', element: 'earth', hearts: 1, inWater: false, charge: true, description: '岸に上がって、四股を踏んでいる' },
    { name: '水鉄砲', element: 'ice', hearts: 1, inWater: true, description: '川の中から、口に水をふくんでいる' },
  ],
  intro: () => ['川岸を歩いていると、水の中から緑色の頭がぬっと出てきた。', '河童「おい、そこの旅の者。おいらと相撲をとっていけ！」'],
  objects: () => [
    { id: 'kappa', label: '🐸 河童', keyword: '河童', desc: 'ぬるぬるしている。頭のてっぺんに、水をたたえた皿がある。', color: '#a8d8a0' },
    { id: 'dish', label: '🍽️ 頭の皿', keyword: '皿', desc: 'この水が干上がると、河童は力が出なくなるらしい。', color: '#cfe3ee' },
    { id: 'cucumber', label: '🥒 畑のきゅうり', keyword: 'きゅうり', desc: '川辺の畑に、みずみずしいきゅうりがなっている。', color: '#bcd6b0' },
  ],
  resolve(spell, ctx) {
    const intent = ctx.intent!;
    const o = emptyOutcome();
    // 皿を乾かすと、河童は力が抜けて降参する
    if (spell.target === 'dish' && (spell.elements.includes('fire') || spell.elements.includes('wind') || spell.usedWordIds.includes('steam'))) {
      if (intent.inWater) {
        o.log.push('皿の水がゆらいだが、川の中にいる河童はすぐに水を足してしまった。');
      } else {
        o.log.push('頭の皿の水が、しゅうっと干上がった！', '河童「ち、力が出ない……」 河童はへなへなと座りこみ、降参した。', '河童は、川の魚をたくさん分けてくれた。ハートが1つ増えた。');
        o.hearts += 1;
        o.discoveries.push('炎・風・蒸気×岸に上がった河童の皿：干上がって降参する');
        o.summary = '河童の皿を乾かして勝った';
        return outcome(o);
      }
    }
    if (spell.target === 'cucumber' && (spell.supports.includes('pull') || spell.supports.includes('boost') || spell.supports.includes('heal'))) {
      o.log.push(spell.supports.includes('pull') ? '✦ きゅうりがふわりと飛んできた。' : 'きゅうりがぐんぐん太くなった。', 'きゅうりを差し出すと、河童の目がきらきら輝いた。', '河童「相撲はまた今度だ！」 河童はきゅうりをかじりながら、川へ帰っていった。');
      o.discoveries.push('引き寄せ・強化・癒し×きゅうり：河童の好物で、相撲をやめてくれる');
      o.summary = 'きゅうりで河童と仲良くなった';
      return outcome(o);
    }
    const thunder = spell.elements.includes('thunder') && intent.inWater;
    const r = fight({ ...spell, target: spell.target === 'dish' || spell.target === 'cucumber' ? 'kappa' : spell.target }, {
      enemy: KAPPA,
      intent,
      extraMult: thunder ? { mult: 2, line: '水の中の河童に雷がよく通った！' } : undefined,
    });
    if (thunder) o.discoveries.push('雷×水の中の敵：よく通って2倍');
    absorb(o, r);
    if (r.slept) {
      o.summary = '河童を眠らせて通り抜けた';
      return outcome(o);
    }
    if (r.hid) {
      o.summary = '灰にまぎれて河童から逃れた';
      return outcome(o);
    }
    if (r.defeated) {
      o.summary = '河童を負かした';
    } else {
      o.log.push('河童「今日のところは引き分けだ！」 河童は笑いながら川へ帰っていった。');
      o.summary = '河童と引き分けた';
    }
    return outcome(o);
  },
};
