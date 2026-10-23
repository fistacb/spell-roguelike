// 日照りの溜め池：日照りが続いて、村の溜め池が干上がりかけている

import { isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, type Outcome, type SceneDef } from '../scene';

function filled(o: Outcome, line: string, discovery: string): Outcome {
  o.log.push(line, '溜め池に水がもどってきた！', '村人たちが大喜びで踊り出した。雨を呼ぶ古い歌を教えてもらった。');
  o.reward = 'rain';
  o.discoveries.push(discovery);
  o.summary = '溜め池に水をもどした';
  return o;
}

function dry(o: Outcome, ...lines: string[]): Outcome {
  o.log.push(...lines, '溜め池はひび割れたままだ。村人たちはため息をついて、遠くの川まで水をくみに行った。');
  o.summary = '溜め池は干上がったままだった';
  return o;
}

export const reservoir: SceneDef = {
  id: 'reservoir',
  title: '日照りの溜め池',
  kind: 'event',
  intro: () => ['もうひと月も雨が降っていないらしい。', '川沿いの村の溜め池が、底が見えるほど干上がっている。村人たちが空を見上げている。'],
  objects: () => [
    { id: 'reservoir', label: '🏞️ 干上がった溜め池', keyword: '溜め池', desc: '底がひび割れている。すぐ横を川が流れているのに、水路がつまっている。', color: '#d8c3a5' },
    { id: 'cloud', label: '☁️ 遠くの雲', keyword: '雲', desc: '山の向こうに、灰色の雲がひとかたまり浮かんでいる。', color: '#d6d0c4' },
    { id: 'drum', label: '🥁 雨乞いの太鼓', keyword: '太鼓', desc: '村の祠に置かれた大きな太鼓。遠くまで響けば、雲が呼べるという。', color: '#e0c9b0' },
  ],
  resolve(spell, ctx) {
    void ctx;
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(dry(o, '呪文は何も起こさなかった。'));
    // 雨はどこに降らせても溜め池にたまる
    if (spell.shapes.includes('rain') && !spell.elements.includes('fire') && !spell.usedWordIds.includes('gravel') && !spell.usedWordIds.includes('steam')) {
      return outcome(filled(o, spell.elements.includes('thunder') ? '稲妻まじりの雨が、ざあざあと降りそそいだ。' : 'しとしとと雨が降りはじめた。', '雨×溜め池：水がたまる'));
    }
    const target = spell.target ?? 'reservoir';
    switch (target) {
      case 'reservoir':
        if (spell.supports.includes('flow')) return outcome(filled(o, '✦ つまっていた水路が通り、川の水が溜め池へ流れこんだ。', '流れ×溜め池：川から水が流れこむ'));
        if (spell.elements.includes('ice') && spell.supports.includes('boost')) return outcome(filled(o, '大きな氷のかたまりが現れ、日差しでとけていった。', '強い氷×溜め池：とけて水になる'));
        if (spell.elements.includes('ice')) return outcome(dry(o, '小さな氷がころんと落ちて、すぐにとけて消えた。'));
        if (spell.elements.includes('fire')) {
          o.hearts -= 1;
          o.log.push('わずかな水まで湯気になって消えた。村人ににらまれ、居づらくなって村を出た。ハートを1つ失った。');
          o.discoveries.push('炎×溜め池：水が干上がる');
          o.summary = '溜め池の水を干上がらせてしまった';
          return outcome(o);
        }
        if (spell.elements.includes('earth') && !isAttack(spell)) return outcome(dry(o, '池の底のひびがふさがった。でも、水がない。'));
        return outcome(dry(o, '乾いた土ぼこりが舞った。'));
      case 'cloud':
        if (spell.supports.includes('pull') || spell.elements.includes('wind')) {
          return outcome(filled(o, spell.elements.includes('wind') ? '風が雲を村の上まで運んできた。' : '✦ 雲がこちらへぐんぐん引き寄せられてきた。', '風・引き寄せ×雲：村の上で雨になる'));
        }
        if (spell.elements.includes('thunder')) return outcome(filled(o, '雲の中で稲妻が走り、雲がもくもくふくらんだ。やがて大粒の雨が落ちてきた。', '雷×雲：ふくらんで雨になる'));
        if (spell.elements.includes('ice')) return outcome(filled(o, '雲が冷えて、ぱらぱらと雨粒が落ちはじめた。', '氷×雲：冷えて雨になる'));
        return outcome(dry(o, '雲は遠くに浮かんだままだ。'));
      case 'drum':
        if (spell.supports.includes('echo') || spell.elements.includes('thunder') || spell.supports.includes('boost')) {
          return outcome(filled(o, 'ドン、ドドン！ 太鼓の音が山まで響き、雲がこちらへ寄ってきた。', '響き・雷・強化×太鼓：雲を呼ぶ'));
        }
        if (isAttack(spell)) return outcome(dry(o, '太鼓の皮が破れてしまった。村人ががっかりしている。'));
        return outcome(dry(o, '太鼓がぽこんと鳴った。'));
      default:
        return outcome(dry(o, 'それはここにはない。'));
    }
  },
};
