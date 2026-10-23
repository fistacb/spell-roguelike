// 壊れた水門：川の水門が壊れ、田んぼに水があふれ出している

import { isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, REGRET_LINE, type Outcome, type SceneDef } from '../scene';

function saved(o: Outcome, line: string, discovery: string): Outcome {
  o.log.push(line, '田んぼの水があふれずに済んだ！', '農夫「稲が助かった！」 農夫は、畑の土をこねる言葉を教えてくれた。');
  o.reward = 'earth';
  o.discoveries.push(discovery);
  o.summary = '壊れた水門をふさいだ';
  return o;
}

function flooded(o: Outcome, ...lines: string[]): Outcome {
  o.log.push(...lines, '田んぼは水びたしになった。農夫は肩を落としている。');
  o.summary = '田んぼが水びたしになった';
  return o;
}

export const sluice: SceneDef = {
  id: 'sluice',
  title: '壊れた水門',
  kind: 'event',
  intro: () => ['川沿いの田んぼで、農夫が叫んでいる。', '農夫「水門が壊れた！ このままじゃ稲が水に沈んじまう！」'],
  objects: () => [
    { id: 'sluice', label: '🚧 壊れた水門', keyword: '水門', desc: '板が割れて、水がどうどう流れこんでいる。ふさぐか、流れを変えるか。', color: '#bfe0f0' },
    { id: 'paddy', label: '🌾 田んぼ', keyword: '田んぼ', desc: '稲の穂がもう少しで水に沈む。', color: '#cfe0b8' },
    { id: 'farmer', label: '🧑‍🌾 農夫', keyword: '農夫', desc: '板と金づちを持って立ち尽くしている。', color: '#e8d7b5' },
  ],
  resolve(spell, ctx) {
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(flooded(o, '呪文は何も起こさなかった。'));
    const target = spell.target ?? 'sluice';
    switch (target) {
      case 'sluice':
        if (spell.shapes.includes('wall') || spell.tricks.includes('mud') || (spell.elements.includes('earth') && !spell.shapes.includes('spear'))) {
          return outcome(saved(o, '水門の割れ目がふさがり、水が止まった。', '壁・土・泥×水門：割れ目がふさがる'));
        }
        if (spell.elements.includes('ice') || spell.tricks.includes('frost')) {
          return outcome(saved(o, '流れこむ水が凍りついて止まった。農夫はそのすきに板を打ちつけた。', '氷・霜×水門：凍って水が止まる'));
        }
        if (spell.supports.includes('flow') || spell.supports.includes('pull')) {
          return outcome(saved(o, '✦ 水の流れが向きを変え、川へ戻っていった。', '流れ・引き寄せ×水門：流れが川へ戻る'));
        }
        if (isAttack(spell)) return outcome(flooded(o, '水門の割れ目がさらに広がった！'));
        return outcome(flooded(o, '水はどうどうと流れこみ続けている。'));
      case 'paddy':
        if (spell.supports.includes('flow')) return outcome(saved(o, '✦ 田んぼの水が水路を伝って、川へ流れ出ていった。', '流れ×田んぼ：水が抜ける'));
        if (spell.supports.includes('boost')) return outcome(flooded(o, '稲がぐんと背を伸ばして、穂が水の上に出た。でも根は水びたしだ。'));
        if (spell.elements.includes('fire')) return outcome(flooded(o, '田んぼから湯気が上がった。'));
        return outcome(flooded(o, '田んぼの水面がゆれた。'));
      case 'farmer':
        if (spell.supports.includes('boost')) return outcome(saved(o, '農夫はものすごい速さで板を打ちつけはじめた！', '強化×農夫：あっという間に直す'));
        if (isAttack(spell)) {
          if (!ctx.warned) return { kind: 'warning', message: '農夫に向けて攻撃の呪文を唱えようとしている。本当に唱える？' };
          o.gainRegret = true;
          o.hearts -= 1;
          o.log.push('農夫「何をする！」 農夫は金づちを振り回して追いかけてきた。ハートを1つ失った。', REGRET_LINE);
          o.discoveries.push('攻撃×人：怒らせてしまう');
          o.summary = '農夫を攻撃してしまった';
          return outcome(o);
        }
        return outcome(flooded(o, '農夫は首をかしげた。'));
      default:
        return outcome(flooded(o, 'それはここにはない。'));
    }
  },
};
