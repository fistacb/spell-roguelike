// 鍛冶屋の手伝い：真っ赤に焼けた鋼を冷やしたいのに、水桶が凍っている

import { isEmpty } from '../parse';
import { emptyOutcome, outcome, type Outcome, type SceneDef } from '../scene';

function tempered(o: Outcome, line: string, discovery: string): Outcome {
  o.log.push(line, 'じゅうっ！ 鋼がきれいに焼き入れされた。', '親方「いい仕事だ！」 親方は、よく切れる刃の言葉を教えてくれた。');
  o.reward = 'blade';
  o.discoveries.push(discovery);
  o.summary = '鍛冶屋の焼き入れを手伝った';
  return o;
}

function spoiled(o: Outcome, ...lines: string[]): Outcome {
  o.log.push(...lines, '鋼は冷めてしまい、もう一度炉に戻すことになった。親方は肩をすくめた。');
  o.summary = '焼き入れは間に合わなかった';
  return o;
}

export const smithy: SceneDef = {
  id: 'smithy',
  title: '鍛冶屋の手伝い',
  kind: 'event',
  intro: () => ['村の鍛冶屋で、親方が真っ赤に焼けた鋼をはさんでいる。', '親方「しまった、水桶が凍ってる！ 熱いうちに冷やさにゃならんのに」'],
  objects: () => [
    { id: 'steel', label: '🗡️ 焼けた鋼', keyword: '鋼', desc: '真っ赤に焼けている。いっきに冷やせば、強い刃になる。', color: '#f0b08a' },
    { id: 'tub', label: '🪣 凍った水桶', keyword: '水桶', desc: '水が凍りついている。', color: '#cfe3ee' },
    { id: 'furnace', label: '🔥 炉', keyword: '炉', desc: '火が弱くなってきている。', color: '#e4a07a' },
  ],
  resolve(spell, ctx) {
    void ctx;
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(spoiled(o, '呪文は何も起こさなかった。'));
    const target = spell.target ?? 'steel';
    const cold = spell.elements.includes('ice') || spell.tricks.includes('frost') || (spell.shapes.includes('rain') && !spell.elements.includes('fire'));
    switch (target) {
      case 'steel':
        if (spell.usedWordIds.includes('steam')) return outcome(tempered(o, '✦ 鋼が熱い蒸気に包まれた。', '蒸気×鋼：むらなく冷える'));
        if (cold) return outcome(tempered(o, '冷たいものが、焼けた鋼をいっきに包んだ。', '氷・霜・雨×焼けた鋼：焼きが入る'));
        if (spell.elements.includes('fire')) return outcome(spoiled(o, '鋼が熱くなりすぎて、ぐにゃりと曲がった。'));
        if (spell.elements.includes('thunder')) return outcome(spoiled(o, '鋼がばちばちと火花を散らした。'));
        return outcome(spoiled(o, '鋼は赤く光っている。'));
      case 'tub':
        if (spell.elements.includes('fire') || spell.elements.includes('thunder')) return outcome(tempered(o, '水桶の氷がとけた。親方はすかさず鋼を水に突っこんだ。', '炎・雷×凍った水桶：氷がとける'));
        if (spell.shapes.includes('rain') || spell.supports.includes('flow')) return outcome(tempered(o, '水桶に冷たい水がなみなみとたまった。', '雨・流れ×水桶：水がたまる'));
        if (spell.shapes.includes('spear') || spell.elements.includes('earth')) return outcome(tempered(o, '水桶の氷が割れて、下の水が見えた。', '槍・土×凍った水桶：氷が割れる'));
        if (spell.elements.includes('ice')) return outcome(spoiled(o, '水桶の氷が、底までかちかちになった。'));
        return outcome(spoiled(o, '水桶はびくともしない。'));
      case 'furnace':
        if (spell.elements.includes('fire') || spell.elements.includes('wind') || spell.supports.includes('boost')) {
          o.log.push('炉の火がごうっと強くなった。', '親方「ありがたい、これでもう一度焼き直せる」 焼き直した鋼は、雪で冷やすことにした。');
          o.discoveries.push('炎・風・強化×炉：火が強くなる');
          o.summary = '炉の火を強くした';
          return outcome(o);
        }
        if (spell.elements.includes('ice') || spell.shapes.includes('rain')) return outcome(spoiled(o, '炉の火がしゅうっと消えかけた。'));
        return outcome(spoiled(o, '炉の火がちらちら揺れた。'));
      default:
        return outcome(spoiled(o, 'それはここにはない。'));
    }
  },
};
