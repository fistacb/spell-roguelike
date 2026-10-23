// 日だまりの大蛇：森の小道の日だまりで、大蛇がとぐろを巻いている

import { absorb, emptyOutcome, fight, outcome, type Enemy, type SceneDef } from '../scene';

// 冷えると動きが鈍る
const SERPENT: Enemy = { name: '大蛇', targets: ['serpent'], toughness: 11, chainable: true };

export const serpent: SceneDef = {
  id: 'serpent',
  title: '日だまりの大蛇',
  kind: 'battle',
  intents: [
    { name: '締めつけ', element: 'earth', hearts: 2, inWater: false, description: 'とぐろをゆるめて、こちらへ鎌首をもたげている' },
    { name: '噛みつき', element: 'wind', hearts: 1, inWater: false, charge: true, description: '草むらをすべるように、まっすぐ這い寄ってくる' },
  ],
  intro: () => ['森の小道の日だまりで、丸太のように太い大蛇がとぐろを巻いている。', '大蛇が薄目を開け、ちろちろと舌を出した。'],
  objects: () => [
    { id: 'serpent', label: '🐍 大蛇', keyword: '大蛇', desc: '日なたで体を温めている。冷えると動けなくなるらしい。', color: '#a8c49a' },
    { id: 'sunspot', label: '☀️ 日だまり', keyword: '日だまり', desc: '大蛇がのんびり温まっている。', color: '#f0e2a8' },
    { id: 'bush', label: '🌿 草むら', keyword: '草むら', desc: '背の高い草が茂っている。身をかくせそう。', color: '#bcd6b0' },
  ],
  resolve(spell, ctx) {
    const intent = ctx.intent!;
    const o = emptyOutcome();
    // 音を立てなければ、大蛇は気づかない
    if (spell.tricks.includes('quiet') && spell.elements.length === 0 && spell.shapes.length === 0) {
      o.log.push('✦ 足音がすっと消えた。', '大蛇はまどろんだまま、こちらに気づかなかった。そっと横を通り抜けた。');
      o.discoveries.push('静けさ×大蛇：気づかれずに通り抜けられる');
      o.summary = '大蛇に気づかれずに通り抜けた';
      return outcome(o);
    }
    if (spell.target === 'bush' && (spell.tricks.includes('smoke') || spell.shapes.includes('wall') || spell.usedWordIds.includes('steam'))) {
      o.log.push('草むらにまぎれて、大蛇の目をかすめた。', '大蛇は首をかしげ、また日なたでうとうとしはじめた。');
      o.discoveries.push('煙・壁×草むら：身をかくして通り抜けられる');
      o.summary = '草むらにかくれて大蛇をやり過ごした';
      return outcome(o);
    }
    // 日だまりを冷やすと、大蛇の動きが鈍る
    let toughnessDown = 0;
    const cooled = (spell.target === 'sunspot' || spell.target === 'serpent' || spell.target === null)
      && (spell.tricks.includes('frost') || spell.elements.includes('ice') || (spell.shapes.includes('rain') && spell.elements.length === 0));
    if (cooled) {
      toughnessDown = 7;
      o.log.push('あたりがひやりと冷えこんだ。大蛇の動きがぐっと鈍くなった。');
      o.discoveries.push('冷たいもの×大蛇：冷えて動きが鈍る');
    }
    if (spell.target === 'sunspot' && spell.elements.includes('fire')) {
      o.log.push('日だまりがぽかぽかと暖まり、大蛇はますます元気になった！');
      toughnessDown = -3;
    }
    const r = fight({ ...spell, target: spell.target === 'sunspot' || spell.target === 'bush' ? 'serpent' : spell.target }, {
      enemy: SERPENT,
      intent,
      toughnessDown,
      noAttack: cooled ? '大蛇はのろのろと身をよじっただけで、襲ってこられなかった。' : undefined,
    });
    absorb(o, r);
    if (r.slept) {
      o.summary = '大蛇を眠らせて通り抜けた';
      return outcome(o);
    }
    if (r.hid) {
      o.summary = '灰にまぎれて大蛇から逃れた';
      return outcome(o);
    }
    if (r.defeated) {
      o.summary = '大蛇を追い払った';
    } else if (cooled) {
      o.log.push('大蛇が寒さで縮こまっているあいだに、先へ進んだ。');
      o.summary = '冷えた大蛇の横をすり抜けた';
    } else {
      o.log.push('大蛇がとぐろを巻き直しているあいだに、走って逃げた。');
      o.summary = '大蛇から逃げた';
    }
    return outcome(o);
  },
};
