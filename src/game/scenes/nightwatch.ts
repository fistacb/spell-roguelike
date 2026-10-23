// 夜の見張り：小鬼の仲間たちが、夜の鶏小屋をねらってやってきた

import { absorb, emptyOutcome, fight, outcome, REGRET_LINE, type Enemy, type SceneDef } from '../scene';

// 暗がりにまぎれているので、光るものが苦手
const IMPS: Enemy = { name: '小鬼たち', targets: ['imps'], toughness: 7, chainable: true, shapeMult: { rain: 1.5 } };

const THANKS = '鶏小屋の主人が、朝いちばんの卵をくれた。ハートが1つ増えた。';

export const nightwatch: SceneDef = {
  id: 'nightwatch',
  title: '夜の見張り',
  kind: 'battle',
  intents: [
    { name: '石つぶて', element: 'earth', hearts: 1, inWater: false, description: '暗がりから小石を投げようとしている' },
    { name: '鶏小屋へ突撃', element: 'fire', hearts: 1, inWater: false, charge: true, description: '松明を振り回して、鶏小屋に走りこもうとしている' },
  ],
  intro: () => ['夜。村の鶏小屋の見張りを頼まれた。', '暗がりで、いくつもの目がぎらりと光った。小鬼の仲間たちだ！'],
  objects: () => [
    { id: 'imps', label: '👺 小鬼たち', keyword: '小鬼たち', desc: '暗がりにまぎれている。まぶしい光は苦手らしい。', color: '#d9c2e6' },
    { id: 'henhouse', label: '🐔 鶏小屋', keyword: '鶏小屋', desc: '中で鶏たちがおびえている。', color: '#f0e2a8' },
    { id: 'torch', label: '🔦 見張りの松明', keyword: '松明', desc: '火が消えかけている。', color: '#f0b08a' },
  ],
  resolve(spell, ctx) {
    const intent = ctx.intent!;
    const o = emptyOutcome();
    const atImps = spell.target === null || spell.target === 'imps' || spell.target === 'enemy';

    // まぶしい光で照らすと、小鬼たちは逃げていく
    const light = (spell.target === 'torch' && (spell.elements.includes('fire') || spell.supports.includes('boost')))
      || (atImps && spell.elements.includes('thunder'));
    if (light) {
      o.hearts += 1;
      o.log.push(spell.target === 'torch' ? '松明がぼうっと燃え上がり、あたりが昼のように明るくなった！' : '稲妻があたりを真っ白に照らした！',
        '小鬼たち「まぶしいっ！」 小鬼たちは目を押さえて逃げていった。', THANKS);
      o.discoveries.push('光（雷・松明）×小鬼たち：まぶしくて逃げていく');
      o.summary = '小鬼たちを光で追い払った';
      return outcome(o);
    }
    if (spell.target === 'henhouse') {
      if (spell.shapes.includes('wall')) {
        o.log.push('鶏小屋のまわりに壁がそびえ立った。', '小鬼たちは壁をぺたぺた叩いていたが、やがてあきらめて帰っていった。');
        o.discoveries.push('壁×鶏小屋：守り切れる');
        o.summary = '壁で鶏小屋を守った';
        return outcome(o);
      }
      if (spell.elements.includes('fire')) {
        o.gainRegret = true;
        o.log.push('鶏小屋に火がついてしまった！ 鶏たちが大さわぎで逃げ出していく。', REGRET_LINE);
        o.discoveries.push('炎×鶏小屋：燃えてしまう');
        o.summary = '鶏小屋を燃やしてしまった';
        return outcome(o);
      }
    }

    const r = fight({ ...spell, target: atImps ? 'imps' : spell.target }, { enemy: IMPS, intent });
    absorb(o, r);
    if (r.slept) {
      o.summary = '小鬼たちを眠らせて通り抜けた';
      return outcome(o);
    }
    if (r.hid) {
      o.summary = '灰にまぎれて小鬼たちから逃れた';
      return outcome(o);
    }
    if (r.defeated) {
      o.hearts += 1;
      o.log.push(THANKS);
      o.summary = '小鬼たちを追い払った';
    } else {
      o.log.push('小鬼たちは卵をいくつか抱えて逃げていった。');
      o.summary = '小鬼たちに卵を取られた';
    }
    return outcome(o);
  },
};
