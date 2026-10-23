// 迷いの灯り：夜の森で、ふらふら揺れる鬼火が道をまどわせる

import { isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, type Outcome, type SceneDef } from '../scene';

function found(o: Outcome, line: string, discovery: string): Outcome {
  o.log.push(line, '本当の道が見えた。夜明け前に森を抜けられた。', '道しるべの陰に、古い旅人の手帳が落ちていた。風の読み方が書いてある。');
  o.reward = 'wind';
  o.discoveries.push(discovery);
  o.summary = '鬼火にまどわされずに森を抜けた';
  return o;
}

function lost(o: Outcome, ...lines: string[]): Outcome {
  o.log.push(...lines, '鬼火を追いかけているうちに、一晩じゅう森をさまよった。ハートを1つ失った。');
  o.hearts -= 1;
  o.summary = '鬼火にまどわされた';
  return o;
}

export const wisp: SceneDef = {
  id: 'wisp',
  title: '迷いの灯り',
  kind: 'event',
  intro: () => ['夜の森。あちこちで青白い灯りがふらふら揺れている。', '鬼火だ。どの灯りを追っても、同じ場所に戻ってきてしまう。'],
  objects: () => [
    { id: 'wisp', label: '👻 鬼火', keyword: '鬼火', desc: '青白く冷たい火。吹けば消えそうなほど頼りない。', color: '#cfe3ee' },
    { id: 'signpost', label: '🪧 道しるべ', keyword: '道しるべ', desc: '暗くて文字が読めない。', color: '#d8c3a5' },
    { id: 'owl', label: '🦉 フクロウ', keyword: 'フクロウ', desc: '木の上からこちらを見ている。森の道を知っていそうだ。', color: '#c7cbd6' },
  ],
  resolve(spell, ctx) {
    void ctx;
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(lost(o, '呪文は何も起こさなかった。'));
    const target = spell.target ?? 'wisp';
    switch (target) {
      case 'wisp':
        if (spell.elements.includes('wind') || spell.shapes.includes('rain') || spell.supports.includes('flow')) {
          return outcome(found(o, '鬼火がふっ、ふっと消えていった。', '風・雨・流れ×鬼火：消える'));
        }
        if (spell.elements.includes('fire')) return outcome(lost(o, '鬼火が炎を吸いこんで、ますます大きくなった。'));
        if (isAttack(spell)) return outcome(lost(o, '呪文は鬼火をすり抜けた。'));
        return outcome(lost(o, '鬼火がくすくす笑うように揺れた。'));
      case 'signpost':
        if (spell.elements.includes('fire') || spell.elements.includes('thunder')) {
          return outcome(found(o, '自分の灯りで照らすと、道しるべの文字が読めた。「出口は北」', '炎・雷×道しるべ：照らして読める'));
        }
        if (spell.supports.includes('heal') || spell.supports.includes('boost')) return outcome(found(o, '道しるべの消えかけた文字が、くっきりと浮かび上がった。', '癒し・強化×道しるべ：文字がよみがえる'));
        return outcome(lost(o, '道しるべは暗いままだ。'));
      case 'owl':
        if (spell.supports.includes('echo') || spell.supports.includes('heal') || spell.supports.includes('pull')) {
          return outcome(found(o, 'フクロウがホウと鳴いて飛び立ち、低い枝から枝へと案内してくれた。', '響き・癒し・引き寄せ×フクロウ：道案内してくれる'));
        }
        if (isAttack(spell)) return outcome(lost(o, 'フクロウはばさりと飛び去った。'));
        return outcome(lost(o, 'フクロウは首をかしげた。'));
      default:
        return outcome(lost(o, 'それはここにはない。'));
    }
  },
};
