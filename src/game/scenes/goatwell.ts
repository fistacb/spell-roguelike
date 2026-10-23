// 井戸の子ヤギ：子ヤギが古井戸に落ちてしまった

import { isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, REGRET_LINE, type Outcome, type SceneDef } from '../scene';

function saved(o: Outcome, line: string, discovery: string): Outcome {
  o.log.push(line, '子ヤギはぴょんと井戸の外へ飛び出した！', '牧場の娘「ありがとう！」 娘は、遠くのものをたぐり寄せるおまじないを教えてくれた。');
  o.reward = 'pull';
  o.discoveries.push(discovery);
  o.summary = '井戸から子ヤギを助けた';
  return o;
}

function stuck(o: Outcome, ...lines: string[]): Outcome {
  o.log.push(...lines, '子ヤギは井戸の底で鳴き続けている。娘ははしごを取りに走っていった。');
  o.summary = '子ヤギを助けられなかった';
  return o;
}

export const goatwell: SceneDef = {
  id: 'goatwell',
  title: '井戸の子ヤギ',
  kind: 'event',
  intro: () => ['牧場のそばの古井戸から、メエメエと鳴き声がする。', '牧場の娘「子ヤギが落ちちゃったの！ 縄が届かなくて……」'],
  objects: () => [
    { id: 'well', label: '🪣 古井戸', keyword: '井戸', desc: '底に水がたまっていて、子ヤギが必死に泳いでいる。足場さえあれば登れそう。', color: '#bfe0f0' },
    { id: 'goat', label: '🐐 子ヤギ', keyword: '子ヤギ', desc: '水の中でもがいている。びっくりさせたら沈んでしまいそう。', color: '#f1ead9' },
    { id: 'rope', label: '🪢 縄', keyword: '縄', desc: '娘が下ろした縄。あと少しで子ヤギに届かない。', color: '#e2cfa8' },
  ],
  resolve(spell, ctx) {
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(stuck(o, '呪文は何も起こさなかった。'));
    const target = spell.target ?? 'well';
    // 雷は子ヤギをおびえさせる
    if (spell.elements.includes('thunder')) {
      o.hearts -= 1;
      o.log.push('雷の音に子ヤギがおびえて、水の中に沈みかけた！', 'あわてて井戸に身を乗り出し、なんとか首根っこをつかんで引き上げた。泥だらけになってハートを1つ失った。');
      o.discoveries.push('雷×子ヤギ：おびえて沈みかける');
      o.summary = '子ヤギをおびえさせてしまった';
      return outcome(o);
    }

    switch (target) {
      case 'well':
        if (spell.elements.includes('ice') || spell.tricks.includes('frost')) {
          return outcome(saved(o, '井戸の水面が凍りつき、子ヤギは氷の上にちょこんと立った。縄に前足をかけて、よじ登ってきた。', '氷×井戸：水面が凍って足場になる'));
        }
        if (spell.shapes.includes('wall')) {
          return outcome(saved(o, '井戸の底から壁がせり上がり、子ヤギを押し上げた。', '壁×井戸：底がせり上がる'));
        }
        if (spell.supports.includes('flow') || spell.supports.includes('boost')) {
          return outcome(saved(o, '✦ 井戸の水があふれ、子ヤギがぷかぷか浮かび上がってきた。', '流れ・強化×井戸：水があふれて浮かび上がる'));
        }
        if (spell.elements.includes('fire')) return outcome(stuck(o, '井戸の水がぬるくなった。子ヤギは少し気持ちよさそうだ。'));
        return outcome(stuck(o, '井戸の底で水しぶきが上がった。'));
      case 'goat':
        if (spell.supports.includes('pull') || spell.shapes.includes('chain')) {
          return outcome(saved(o, spell.shapes.includes('chain') ? '鎖が子ヤギの体にやさしく巻きつき、引き上げた。' : '✦ 子ヤギの体がふわりと浮き、手もとへ引き寄せられた。', '引き寄せ・鎖×子ヤギ：引き上げられる'));
        }
        if (spell.supports.includes('heal')) return outcome(stuck(o, '子ヤギが元気になって、ますます大きな声で鳴き出した。'));
        if (isAttack(spell)) {
          o.gainRegret = true;
          o.log.push('呪文が子ヤギをかすめた。子ヤギは悲鳴を上げて沈みかけ、娘が泣き出した。', REGRET_LINE);
          o.discoveries.push('攻撃×子ヤギ：傷つけてしまう');
          o.summary = '子ヤギを傷つけてしまった';
          return outcome(o);
        }
        return outcome(stuck(o, '子ヤギはメエと鳴いた。'));
      case 'rope':
        if (spell.supports.includes('boost') || spell.shapes.includes('chain') || spell.supports.includes('pull')) {
          return outcome(saved(o, '縄がするすると伸びて、子ヤギの前に垂れ下がった。子ヤギは縄をくわえ、引き上げられた。', '強化・鎖・引き寄せ×縄：伸びて届く'));
        }
        if (spell.elements.includes('fire') || spell.shapes.includes('blade')) {
          o.discoveries.push('炎・刃×縄：切れてしまう');
          return outcome(stuck(o, '縄がぷつんと切れて、井戸に落ちていった。'));
        }
        return outcome(stuck(o, '縄がゆらゆら揺れた。'));
      default:
        void ctx;
        return outcome(stuck(o, 'それはここにはない。'));
    }
  },
};
