// 大川の渡し場：渡し舟の船頭が腰を痛めていて、川を渡れない

import { isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, REGRET_LINE, type Outcome, type SceneDef } from '../scene';

function crossed(o: Outcome, summary: string, discovery: string, ...lines: string[]): Outcome {
  o.log.push(...lines);
  o.discoveries.push(discovery);
  o.summary = summary;
  return o;
}

// 渡れなかったときは、泳いで渡って体が冷える
function swam(o: Outcome, ...lines: string[]): Outcome {
  o.hearts -= 1;
  o.log.push(...lines, 'しかたなく泳いで渡った。体が冷えて、ハートを1つ失った。');
  o.summary = '大川を泳いで渡った';
  return o;
}

export const ferry: SceneDef = {
  id: 'ferry',
  title: '大川の渡し場',
  kind: 'event',
  intro: () => ['大きな川の渡し場に着いた。', '船頭「いてて……腰をやっちまって、今日は舟を出せねえんだ」'],
  objects: () => [
    { id: 'river', label: '🌊 大川', keyword: '大川', desc: '流れは速いが、深くはなさそう。', color: '#bfe0f0' },
    { id: 'boat', label: '🛶 渡し舟', keyword: '渡し舟', desc: 'ロープで向こう岸の杭とつながっている。', color: '#d8c3a5' },
    { id: 'boatman', label: '🧔 船頭', keyword: '船頭', desc: '腰をさすっている。', color: '#e8d7b5' },
  ],
  resolve(spell, ctx) {
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(swam(o, '呪文は何も起こさなかった。'));
    const target = spell.target ?? (spell.supports.includes('heal') && !isAttack(spell) ? 'boatman' : 'river');

    switch (target) {
      case 'river':
        if (spell.elements.includes('ice') || spell.tricks.includes('frost')) {
          o.gainWords.push('frost');
          return outcome(crossed(o, '大川を凍らせて歩いて渡った', '氷・霜×大川：凍って歩いて渡れる',
            '大川の表面がみるみる凍っていく。', '氷の上を歩いて向こう岸へ渡った。船頭「たまげたなあ！」'));
        }
        if (spell.shapes.includes('wall') && spell.elements.includes('earth')) {
          return outcome(crossed(o, '土の壁で大川に橋をかけた', '土の壁×大川：橋になる',
            '川底から土の壁がせり上がり、向こう岸まで続く道になった。'));
        }
        if (spell.shapes.includes('wall')) {
          o.discoveries.push('壁×大川：流されてしまう（土なら残るかも）');
          return outcome(swam(o, '壁は流れに押し流されてしまった。'));
        }
        return outcome(swam(o, '川面に呪文が落ちたが、流れは変わらない。'));
      case 'boat':
        if (spell.shapes.includes('chain')) {
          return outcome(crossed(o, '鎖で渡し舟をたぐり寄せて渡った', '鎖×渡し舟：たぐり寄せて自分で渡れる',
            '鎖を舟のロープに絡めて、ぐいぐいと向こう岸へたぐり寄せた。'));
        }
        if (spell.supports.includes('boost')) {
          return outcome(crossed(o, '渡し舟を強化して渡った', '強化×渡し舟：ひとりでに進む',
            '舟がぶるっと震えて、ひとりでに向こう岸へ進み出した！'));
        }
        if (spell.elements.includes('fire') || isAttack(spell)) {
          o.discoveries.push('攻撃×渡し舟：壊れてしまう');
          o.gainRegret = true;
          return outcome(swam(o, '渡し舟が壊れてしまった。船頭「おいおい、商売道具が……」', REGRET_LINE));
        }
        return outcome(swam(o, '舟がゆらゆら揺れただけだった。'));
      case 'boatman':
        if (spell.supports.includes('heal')) {
          o.hearts += 1;
          o.reward = 'rain';
          return outcome(crossed(o, '船頭の腰を治して舟に乗せてもらった', '癒し×船頭：腰が治って舟を出してくれる',
            '船頭「おお、腰が軽い！ お礼に乗っていきな」', '舟の上で干し魚をもらった。ハートが1つ増えた。',
            '船頭「川の上ではな、雨の呪文が役に立つんだ」'));
        }
        if (spell.supports.includes('boost')) {
          return outcome(crossed(o, '船頭を強化して舟を出してもらった', '強化×船頭：痛みを忘れて舟をこぐ',
            '船頭「なんだか力が湧いてきた！」', '船頭は猛烈な速さで舟をこぎ、あっという間に向こう岸に着いた。'));
        }
        if (isAttack(spell)) {
          if (!ctx.warned) return { kind: 'warning', message: '船頭に向けて攻撃の呪文を唱えようとしている。本当に唱える？' };
          o.gainRegret = true;
          o.discoveries.push('攻撃×人：怒らせてしまう');
          return outcome(swam(o, '船頭「なにしやがる！」 船頭はかんかんに怒って小屋にこもってしまった。', REGRET_LINE));
        }
        return outcome(swam(o, '船頭はきょとんとしている。'));
      default:
        return outcome(swam(o, 'それはここにはない。'));
    }
  },
};
