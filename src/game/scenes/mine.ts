// 崩れた坑道：山の坑道が崩れて、坑夫が閉じこめられた

import { ATTACK_SHAPES, isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, type Outcome, type SceneDef } from '../scene';

function rescued(o: Outcome, line: string, discovery: string): Outcome {
  o.log.push(line, '坑夫が瓦礫の間から這い出してきた！', '坑夫「恩に着るぜ」 坑夫は、小石をばらまく言葉を教えてくれた。');
  o.reward = 'gravel';
  o.discoveries.push(discovery);
  o.summary = '坑道から坑夫を助け出した';
  return o;
}

function trapped(o: Outcome, ...lines: string[]): Outcome {
  o.log.push(...lines, '瓦礫を手でどけるのを手伝った。何時間もかかって、坑夫はやっと出てきた。ハートを1つ失った。');
  o.hearts -= 1;
  o.summary = '手作業で坑夫を助けた';
  return o;
}

export const mine: SceneDef = {
  id: 'mine',
  title: '崩れた坑道',
  kind: 'event',
  intro: () => ['山の坑道から、仲間の坑夫たちが飛び出してきた。', '「中が崩れて、一人閉じこめられた！」 奥から、かすかに助けを呼ぶ声がする。'],
  objects: () => [
    { id: 'rubble', label: '🪨 瓦礫', keyword: '瓦礫', desc: '道をふさいでいる。すき間に鋭く穴をあければ、抜けられそう。', color: '#c9b9a0' },
    { id: 'beam', label: '🪵 傾いた坑木', keyword: '坑木', desc: '天井を支える柱。今にも折れそう。大きな衝撃は禁物だ。', color: '#d8c3a5' },
    { id: 'miner', label: '⛏️ 閉じこめられた坑夫', keyword: '坑夫', desc: '瓦礫の向こうにいる。声は元気そうだ。', color: '#e8d7b5' },
  ],
  resolve(spell, ctx) {
    void ctx;
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(trapped(o, '呪文は何も起こさなかった。'));
    const shaped = spell.shapes.some((s) => ATTACK_SHAPES.includes(s));
    const target = spell.target ?? (shaped ? 'rubble' : 'beam');
    // 雷や嵐の衝撃で、天井がさらに崩れる
    if (spell.elements.includes('thunder') && target !== 'miner') {
      o.hearts -= 2;
      o.log.push('雷の衝撃で、天井がばらばらと崩れてきた！ あわてて外へ逃げた。ハートを2つ失った。', '坑夫は、仲間たちが夜通し掘り出した。');
      o.discoveries.push('雷×坑道：衝撃で天井が崩れる');
      o.summary = '坑道をさらに崩してしまった';
      return outcome(o);
    }
    switch (target) {
      case 'rubble':
        if (spell.shapes.includes('spear') && !spell.shapes.includes('rain')) return outcome(rescued(o, '槍が瓦礫のすき間をまっすぐ貫き、人ひとり通れる穴があいた。', '槍×瓦礫：まっすぐ穴があく'));
        if (spell.supports.includes('pull')) return outcome(rescued(o, '✦ 瓦礫がひとつずつ、こちらへ転がり出てきた。', '引き寄せ×瓦礫：ひとつずつ引き出せる'));
        if (spell.shapes.includes('rain') || spell.shapes.includes('blade')) return outcome(trapped(o, '瓦礫の表面がばらばらと崩れただけだった。'));
        if (spell.elements.includes('fire')) return outcome(trapped(o, '坑道に煙がこもって、むせかえった。'));
        return outcome(trapped(o, '瓦礫はびくともしない。'));
      case 'beam':
        if (spell.shapes.includes('wall') || (spell.elements.includes('earth') && !shaped) || spell.elements.includes('ice')) {
          return outcome(rescued(o, '天井がしっかり支えられた。坑夫は落ち着いて、瓦礫を内側からどけた。', '壁・土・氷×坑木：天井が支えられる'));
        }
        if (spell.supports.includes('boost') || spell.supports.includes('heal')) return outcome(rescued(o, '坑木がみしりと太くなり、天井をぐいっと押し上げた。', '強化・癒し×坑木：太くなって天井を押し上げる'));
        if (isAttack(spell)) {
          o.hearts -= 2;
          o.log.push('坑木が折れて、天井が崩れ落ちてきた！ ハートを2つ失った。', '坑夫は、仲間たちが夜通し掘り出した。');
          o.discoveries.push('攻撃×坑木：天井が崩れる');
          o.summary = '坑道をさらに崩してしまった';
          return outcome(o);
        }
        return outcome(trapped(o, '坑木がみしみしと鳴った。'));
      case 'miner':
        if (spell.supports.includes('boost')) return outcome(rescued(o, '坑夫がつるはしをふるうと、瓦礫がみるみるどけられた。', '強化×坑夫：自分で掘り出せる'));
        if (spell.supports.includes('pull')) return outcome(rescued(o, '✦ 坑夫の体が、瓦礫のすき間からするりと引き寄せられた。', '引き寄せ×坑夫：すき間から引き出せる'));
        if (spell.supports.includes('heal')) return outcome(trapped(o, '坑夫の声が元気になった。「まだまだいけるぞ！」'));
        return outcome(trapped(o, '坑夫「おーい、早くしてくれ！」'));
      default:
        return outcome(trapped(o, 'それはここにはない。'));
    }
  },
};
