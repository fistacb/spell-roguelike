// 凍った滝：山道が、凍りついた滝の氷でふさがれている

import { isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, type Outcome, type SceneDef } from '../scene';

function broke(o: Outcome, line: string, discovery: string): Outcome {
  o.log.push(line, '氷の壁がくずれ、道が開けた。', '割れた氷のかけらが、きらきらと霜になって舞った。その冷たさを覚えた。');
  o.reward = 'frost';
  o.discoveries.push(discovery);
  o.summary = '凍った滝を割って進んだ';
  return o;
}

function around(o: Outcome, ...lines: string[]): Outcome {
  o.log.push(...lines, 'しかたなく、凍った岩場をよじ登って遠回りした。手がかじかんで、ハートを1つ失った。');
  o.hearts -= 1;
  o.summary = '凍った滝を遠回りした';
  return o;
}

export const icefall: SceneDef = {
  id: 'icefall',
  title: '凍った滝',
  kind: 'event',
  intro: () => ['山道の先で、滝がまるごと凍りついている。', '分厚い氷の壁が、道をすっかりふさいでいる。'],
  objects: () => [
    { id: 'icefall', label: '🧊 凍った滝', keyword: '滝', desc: '分厚い氷。表面をとかしても、すぐまた凍りそう。', color: '#cfe3ee' },
    { id: 'crack', label: '⚡ 氷のひび', keyword: 'ひび', desc: '真ん中に細いひびが一本走っている。鋭く突けば、割れそう。', color: '#bfe0f0' },
    { id: 'icicle', label: '🔻 つらら', keyword: 'つらら', desc: '頭の上に、大きなつららが何本も下がっている。', color: '#e3edf5' },
  ],
  resolve(spell, ctx) {
    void ctx;
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(around(o, '呪文は何も起こさなかった。'));
    const target = spell.target ?? (spell.shapes.includes('spear') ? 'crack' : 'icefall');
    switch (target) {
      case 'crack':
        if (spell.shapes.includes('spear') || spell.usedWordIds.includes('gravel') || spell.elements.includes('earth')) {
          return outcome(broke(o, 'ひびに呪文が突き刺さり、ぴしぴしと音を立てて広がった。', '槍・土×氷のひび：割れて崩れる'));
        }
        if (spell.elements.includes('thunder')) return outcome(broke(o, '雷がひびを伝って走り、氷がまっぷたつに割れた。', '雷×氷のひび：割れて崩れる'));
        if (spell.elements.includes('ice')) return outcome(around(o, 'ひびが凍ってふさがってしまった。'));
        return outcome(around(o, 'ひびの奥で、水がちょろちょろ流れる音がした。'));
      case 'icefall':
        if (spell.elements.includes('thunder') && spell.shapes.includes('spear')) return outcome(broke(o, '雷の槍が氷の壁を貫いた。', '雷の槍×凍った滝：貫いて崩れる'));
        if (spell.elements.includes('fire') && (spell.supports.includes('boost') || spell.supports.includes('echo'))) {
          return outcome(broke(o, '強い炎が氷の壁をいっきにとかした。', '強い炎×凍った滝：とけて崩れる'));
        }
        if (spell.elements.includes('fire') || spell.usedWordIds.includes('steam')) {
          o.discoveries.push('炎×凍った滝：表面がとけるだけ');
          return outcome(around(o, '氷の表面がとけたが、流れた水が足もとでまた凍った。'));
        }
        if (spell.shapes.includes('spear')) return outcome(broke(o, '槍が氷の壁に突き刺さり、ひびが四方に走った。', '槍×凍った滝：ひびが走って崩れる'));
        if (isAttack(spell)) return outcome(around(o, '呪文は氷の壁にはじかれた。'));
        return outcome(around(o, '氷の壁はびくともしない。'));
      case 'icicle':
        if (isAttack(spell) || spell.supports.includes('echo')) {
          o.hearts -= 1;
          o.log.push('つららが折れて、頭の上に降ってきた！ ハートを1つ失った。');
          return outcome(broke(o, '落ちたつららが氷の壁にぶつかり、壁が崩れた。', '攻撃・響き×つらら：落ちてきて壁を崩す'));
        }
        return outcome(around(o, 'つららがきらりと光った。'));
      default:
        return outcome(around(o, 'それはここにはない。'));
    }
  },
};
