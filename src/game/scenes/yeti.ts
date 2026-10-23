// 雪男：吹きだまりの峠で、雪男が行く手をふさぐ

import { absorb, emptyOutcome, fight, outcome, type Enemy, type SceneDef } from '../scene';

// 寒さには強いが、火をこわがる
const YETI: Enemy = { name: '雪男', targets: ['yeti'], toughness: 10, chainable: true };

export const yeti: SceneDef = {
  id: 'yeti',
  title: '峠の雪男',
  kind: 'battle',
  intents: [
    { name: '雪玉投げ', element: 'ice', hearts: 1, inWater: false, description: '大きな雪玉を抱えて、振りかぶっている' },
    { name: '体当たり', element: 'ice', hearts: 2, inWater: false, charge: true, description: '雪をけたてて、まっすぐ走ってくる' },
  ],
  intro: () => ['峠の吹きだまりで、白い毛むくじゃらの大男が立ち上がった。', '雪男だ！ うなり声を上げて、こちらをにらんでいる。'],
  objects: () => [
    { id: 'yeti', label: '🦍 雪男', keyword: '雪男', desc: '分厚い毛皮で、冷たいものはまるで効かなそう。', color: '#e6eef5' },
    { id: 'campfire', label: '🪵 焚き火の跡', keyword: '焚き火', desc: '前の旅人が残した薪が、雪をかぶっている。', color: '#e4a07a' },
    { id: 'cave', label: '🕳️ 洞穴', keyword: '洞穴', desc: '雪男のねぐららしい。奥で何かが動いた。', color: '#c9c4b8' },
  ],
  resolve(spell, ctx) {
    const intent = ctx.intent!;
    const o = emptyOutcome();
    // 焚き火をおこすと、雪男は火をこわがって逃げていく
    if (spell.target === 'campfire' && (spell.elements.includes('fire') || spell.elements.includes('thunder'))) {
      o.log.push('焚き火がぱちぱちと燃え上がった。', '雪男は火を見るなり、悲鳴を上げて洞穴へ逃げこんだ。', '焚き火で暖まってから、峠を越えた。ハートが1つ増えた。');
      o.hearts += 1;
      o.discoveries.push('炎・雷×焚き火：雪男は火をこわがる');
      o.summary = '焚き火で雪男を追い払った';
      return outcome(o);
    }
    if (spell.target === 'cave') {
      if (spell.tricks.includes('quiet') || spell.tricks.includes('smoke') || spell.usedWordIds.includes('steam')) {
        o.log.push(spell.tricks.includes('quiet') ? '✦ あたりの音が消えた。' : '✦ 洞穴から白い煙が噴き出した。', '洞穴の奥から子どもの雪男がとことこ出てきて、親の足にしがみついた。', '雪男は子どもを抱えて、のそのそと去っていった。');
        o.discoveries.push('静けさ・煙×洞穴：子どもが出てきて、雪男は去っていく');
        o.summary = '雪男の親子を見送った';
        return outcome(o);
      }
      if (spell.elements.length > 0 || spell.shapes.length > 0) {
        o.hearts -= 1;
        o.log.push('洞穴の奥から、子どもの雪男の泣き声がした！', '雪男が怒り狂って飛びかかってきた。ハートを1つ失った。');
        o.discoveries.push('攻撃×洞穴：子どもがいて雪男が怒る');
        o.summary = '雪男を怒らせてしまった';
        return outcome(o);
      }
    }
    const r = fight({ ...spell, target: spell.target === 'campfire' || spell.target === 'cave' ? 'yeti' : spell.target }, { enemy: YETI, intent });
    absorb(o, r);
    if (r.slept) {
      o.summary = '雪男を眠らせて通り抜けた';
      return outcome(o);
    }
    if (r.hid) {
      o.summary = '灰にまぎれて雪男から逃れた';
      return outcome(o);
    }
    if (r.defeated) {
      o.summary = '雪男を追い払った';
    } else {
      o.log.push('雪男が雪をかいている間に、峠を駆け下りた。');
      o.summary = '雪男から逃げた';
    }
    return outcome(o);
  },
};
