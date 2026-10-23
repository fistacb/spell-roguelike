// 旅の行商人：ロバが疲れて動けない行商人。ハートと引き換えに「引き寄せ」を教えてくれる

import { isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, REGRET_LINE, type Outcome, type SceneDef } from '../scene';

const PULL_LINE = '行商人「お礼に、遠くのものを手もとに呼ぶおまじないを教えよう」';

function helped(o: Outcome, summary: string, discovery: string, ...lines: string[]): Outcome {
  o.log.push(...lines, PULL_LINE);
  o.discoveries.push(discovery);
  o.summary = summary;
  o.reward = 'pull';
  return o;
}

// 何もできなかったときは、ハートひとつ分のお代で言葉を買う
function bought(o: Outcome, ...lines: string[]): Outcome {
  o.hearts -= 1;
  o.log.push(...lines, '行商人「なら、商売といこう」 旅の疲れと引き換えに、言葉をひとつ買った。ハートを1つ失った。', PULL_LINE);
  o.discoveries.push('行商人：ハートと引き換えに言葉を売ってくれる');
  o.summary = '行商人から言葉を買った';
  o.reward = 'pull';
  return o;
}

export const merchant: SceneDef = {
  id: 'merchant',
  title: '旅の行商人',
  kind: 'event',
  intro: () => ['街道の脇で、行商人が困った顔をしている。', '行商人「ロバがへばっちまってね。荷物が重すぎたかな」'],
  objects: () => [
    { id: 'merchant', label: '🧑‍💼 行商人', keyword: '行商人', desc: '珍しい品と、珍しい言葉を扱っているらしい。', color: '#e8d7b5' },
    { id: 'donkey', label: '🫏 ロバ', keyword: 'ロバ', desc: 'ぐったりと座りこんでいる。', color: '#d6c4a8' },
    { id: 'pack', label: '🎒 荷物', keyword: '荷物', desc: 'ロバの背中に山のように積まれている。', color: '#d8c3a5' },
  ],
  resolve(spell, ctx) {
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(bought(o, '呪文は何も起こさなかった。'));
    const target = spell.target ?? (isAttack(spell) ? 'pack' : 'donkey');

    switch (target) {
      case 'donkey':
        if (spell.supports.includes('heal') || spell.supports.includes('boost')) {
          return outcome(helped(o, 'ロバを元気にしてあげた', '癒し・強化×ロバ：元気に立ち上がる',
            'ロバがひと声鳴いて、元気に立ち上がった！'));
        }
        if (isAttack(spell)) {
          o.gainRegret = true;
          o.hearts -= 1;
          o.log.push('呪文がロバをかすめた。ロバは悲鳴を上げて逃げていった。', '行商人「なんてことを！」 荷物でぶたれて、ハートを1つ失った。', REGRET_LINE);
          o.summary = 'ロバを傷つけてしまった';
          return outcome(o);
        }
        return outcome(bought(o, 'ロバはぐったりしたままだ。'));
      case 'pack':
        if (spell.supports.includes('flow') || spell.supports.includes('pull') || (spell.shapes.includes('wall') && spell.elements.includes('earth'))) {
          return outcome(helped(o, '荷物を軽くしてあげた', '流れ・土の壁×荷物：運ぶのを手伝える',
            '荷物の半分を運ぶのを手伝った。', 'ロバはほっとしたように立ち上がった。'));
        }
        if (spell.elements.includes('fire') || isAttack(spell)) {
          o.gainRegret = true;
          o.hearts -= 1;
          o.log.push('荷物が燃えてしまった！', '行商人「わしの商売道具が……」 ハートを1つ失った。', REGRET_LINE);
          o.summary = '行商人の荷物を燃やしてしまった';
          return outcome(o);
        }
        return outcome(bought(o, '荷物は重たいままだ。'));
      case 'merchant':
        if (isAttack(spell)) {
          if (!ctx.warned) return { kind: 'warning', message: '行商人に向けて攻撃の呪文を唱えようとしている。本当に唱える？' };
          o.gainRegret = true;
          o.log.push('行商人「ひいっ！」 行商人はロバを置いて逃げていった。', REGRET_LINE);
          o.summary = '行商人を追い払ってしまった';
          return outcome(o);
        }
        if (spell.supports.includes('heal')) {
          return outcome(helped(o, '行商人の疲れを癒した', '癒し×行商人：疲れが取れて歩き出せる',
            '行商人「おお、体が軽い！ これならロバの代わりにわしが担げる」'));
        }
        return outcome(bought(o, '行商人は首をかしげている。'));
      default:
        return outcome(bought(o, 'それはここにはない。'));
    }
  },
};
