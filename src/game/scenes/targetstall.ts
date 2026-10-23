// 的当て屋台：街道の市で、槍投げの的当てをやっている

import { isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, REGRET_LINE, type Outcome, type SceneDef } from '../scene';

function bullseye(o: Outcome, line: string, discovery: string): Outcome {
  o.log.push(line, '店主「大当たりー！」 鐘がカランカランと鳴った。', '景品は、古びた鎖の飾りだった。手に取ると、つなぎとめる言葉が浮かんだ。');
  o.reward = 'chain';
  o.discoveries.push(discovery);
  o.summary = '的当てで大当たりを出した';
  return o;
}

function miss(o: Outcome, ...lines: string[]): Outcome {
  o.log.push(...lines, '店主「残念！ また来てね」');
  o.summary = '的当てははずれた';
  return o;
}

export const targetstall: SceneDef = {
  id: 'targetstall',
  title: '的当て屋台',
  kind: 'event',
  intro: () => ['街道の市に、的当ての屋台が出ている。', '店主「真ん中に当てたら大当たり！ 魔法を使ってもいいよ。ただし、まっすぐ飛ぶものに限る！」'],
  objects: () => [
    { id: 'mark', label: '🎯 的', keyword: '的', desc: '遠くの板にかかった小さな的。風でゆらゆら揺れている。', color: '#f0c8d0' },
    { id: 'prize', label: '🎁 景品', keyword: '景品', desc: '棚に並んでいる。', color: '#e6d89c' },
    { id: 'keeper', label: '🧔 店主', keyword: '店主', desc: '大きな声で客を呼んでいる。', color: '#e8d7b5' },
  ],
  resolve(spell, ctx) {
    void ctx;
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(miss(o, '呪文は何も起こさなかった。'));
    const target = spell.target ?? 'mark';
    switch (target) {
      case 'mark':
        if (spell.elements.includes('fire') || spell.elements.includes('thunder')) {
          o.hearts -= 1;
          o.log.push('的が燃え上がってしまった！ 弁償に、手持ちの食べ物をみんな置いていった。ハートを1つ失った。');
          o.discoveries.push('炎・雷×的：燃えてしまう');
          o.summary = '的を燃やしてしまった';
          return outcome(o);
        }
        if (spell.shapes.includes('spear') && !spell.shapes.includes('rain')) return outcome(bullseye(o, '槍がまっすぐ飛び、的のど真ん中に突き立った！', '槍×的：まっすぐ飛ぶ'));
        if (spell.shapes.includes('rain')) return outcome(miss(o, 'ばらばらと散らばって、いくつかは的に当たった。', '店主「数打ちゃ当たる、はなしだよ！」'));
        if (spell.shapes.includes('blade') || spell.shapes.includes('chain')) return outcome(miss(o, 'くるくる回って、的の横にそれた。'));
        if (spell.supports.includes('pull')) return outcome(bullseye(o, '✦ 的がすうっと目の前まで寄ってきた。ぺたりと手で真ん中にふれた。', '引き寄せ×的：目の前まで寄ってくる'));
        if (spell.tricks.includes('quiet') || (spell.elements.includes('wind') && !isAttack(spell))) {
          return outcome(miss(o, '的の揺れがぴたりと止まった。でも、投げるものがない。'));
        }
        return outcome(miss(o, '的はゆらゆら揺れている。'));
      case 'prize':
        if (spell.supports.includes('pull') || spell.shapes.includes('chain')) {
          o.gainRegret = true;
          o.log.push('景品がこちらへ飛んできた。店主「こら、どろぼう！」', 'あわてて返したが、まわりの目が冷たい。', REGRET_LINE);
          o.discoveries.push('引き寄せ・鎖×景品：盗みになる');
          o.summary = '景品を盗もうとしてしまった';
          return outcome(o);
        }
        return outcome(miss(o, '景品はきらきら光っている。'));
      case 'keeper':
        if (spell.supports.includes('echo') || spell.supports.includes('heal')) {
          o.log.push('店主の声がよく通るようになった。屋台に客がどっと集まってきた。', '店主「お礼に一回ただでいいよ！」 投げた槍は的をかすめた。残念賞の焼き団子をもらった。ハートが1つ増えた。');
          o.hearts += 1;
          o.discoveries.push('響き・癒し×店主：客が集まってお礼がもらえる');
          o.summary = '屋台をにぎわせた';
          return outcome(o);
        }
        if (isAttack(spell)) {
          o.gainRegret = true;
          o.hearts -= 1;
          o.log.push('店主「なにしやがる！」 屋台から追い出された。ハートを1つ失った。', REGRET_LINE);
          o.discoveries.push('攻撃×人：怒らせてしまう');
          o.summary = '店主を攻撃してしまった';
          return outcome(o);
        }
        return outcome(miss(o, '店主はにこにこしている。'));
      default:
        return outcome(miss(o, 'それはここにはない。'));
    }
  },
};
