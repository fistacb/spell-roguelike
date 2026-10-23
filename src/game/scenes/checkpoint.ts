// 関所の番兵：街道の関所で、通行手形のない旅人は通さないと言われる

import { isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, REGRET_LINE, type Outcome, type SceneDef } from '../scene';

function passed(o: Outcome, summary: string, discovery: string, ...lines: string[]): Outcome {
  o.log.push(...lines);
  o.discoveries.push(discovery);
  o.summary = summary;
  return o;
}

function turnedBack(o: Outcome, ...lines: string[]): Outcome {
  o.log.push(...lines, '番兵「手形のない者は通せん」 しかたなく、関所を避けて山を大回りした。ハートを1つ失った。');
  o.hearts -= 1;
  o.summary = '関所を大回りした';
  return o;
}

export const checkpoint: SceneDef = {
  id: 'checkpoint',
  title: '関所の番兵',
  kind: 'event',
  intro: () => ['街道に関所がある。いかつい番兵が門の前に立っている。', '番兵「通行手形を見せろ。ないなら通さん」'],
  objects: () => [
    { id: 'guard', label: '💂 番兵', keyword: '番兵', desc: '一晩じゅう立ちっぱなしで、腰をさすっている。あくびもかみ殺している。', color: '#d6d0c4' },
    { id: 'gate', label: '🚪 関所の門', keyword: '門', desc: '分厚い木の門。壊せば大さわぎになりそう。', color: '#c9b9a0' },
    { id: 'lantern', label: '🏮 詰所の灯り', keyword: '灯り', desc: '詰所の中を照らしている。ほかの番兵たちが休んでいる。', color: '#f0d9a0' },
  ],
  resolve(spell, ctx) {
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(turnedBack(o, '呪文は何も起こさなかった。'));
    const target = spell.target ?? (isAttack(spell) ? 'gate' : 'guard');
    if (!isAttack(spell) && (spell.tricks.includes('quiet') || spell.tricks.includes('smoke') || spell.tricks.includes('ash'))) {
      return outcome(passed(o, '関所をこっそり通り抜けた', '静けさ・煙・灰×関所：気づかれずに通れる',
        spell.tricks.includes('quiet') ? '✦ 足音がすっと消えた。' : '✦ あたりがかすんで、番兵の目がくらんだ。', 'そのすきに、門の脇をすり抜けた。'));
    }
    switch (target) {
      case 'guard':
        if (spell.supports.includes('sleep')) {
          o.gainWords.push('quiet');
          return outcome(passed(o, '番兵を眠らせて通った', '眠り×番兵：立ったまま眠る', '✦ 番兵は立ったまま、こっくりこっくり眠りはじめた。', 'そっと門をくぐった。'));
        }
        if (spell.supports.includes('heal')) {
          o.reward = 'sleep';
          return outcome(passed(o, '番兵の腰を治して通してもらった', '癒し×番兵：腰が治って機嫌がよくなる',
            '番兵の腰の痛みがすっと消えた。', '番兵「おお……楽になった。手形は……まあいい、通れ」', '番兵は、夜番のときに口ずさむ子守歌を教えてくれた。'));
        }
        if (isAttack(spell)) {
          if (!ctx.warned) return { kind: 'warning', message: '番兵に向けて攻撃の呪文を唱えようとしている。本当に唱える？' };
          o.gainRegret = true;
          o.hearts -= 2;
          o.log.push('番兵の叫び声で、詰所から仲間が飛び出してきた！', 'さんざん追い回されて、ハートを2つ失った。', REGRET_LINE);
          o.discoveries.push('攻撃×番兵：仲間が飛び出してくる');
          o.summary = '番兵とけんかになった';
          return outcome(o);
        }
        return outcome(turnedBack(o, '番兵はじろりとこちらをにらんだ。'));
      case 'gate':
        if (spell.supports.includes('pull')) {
          return outcome(passed(o, '門のかんぬきを引き寄せて通った', '引き寄せ×門：かんぬきが外れる', '✦ かんぬきがするりと抜けて、門が少し開いた。', '番兵が振り向く前に、すき間から抜け出した。'));
        }
        if (isAttack(spell)) {
          o.hearts -= 1;
          o.gainRegret = true;
          o.log.push('門が砕けて、番兵たちが大さわぎになった。', 'なんとか走り抜けたが、石を投げられてハートを1つ失った。', REGRET_LINE);
          o.discoveries.push('攻撃×門：壊すと大さわぎ');
          o.summary = '関所の門を壊して走り抜けた';
          return outcome(o);
        }
        return outcome(turnedBack(o, '門はがっしりと閉じている。'));
      case 'lantern':
        if (spell.supports.includes('sleep') || spell.elements.includes('ice') || spell.elements.includes('wind')) {
          return outcome(passed(o, '灯りを消して暗がりを通った', '風・氷・眠り×灯り：消えて暗がりができる', '詰所の灯りがふっと消えた。', '番兵「なんだ？」 番兵が詰所をのぞきこんでいるすきに、門をくぐった。'));
        }
        if (spell.elements.includes('fire')) return outcome(turnedBack(o, '灯りがぱっと明るくなった。番兵がますますよく見えるようになった。'));
        return outcome(turnedBack(o, '灯りがちらちら揺れた。'));
      default:
        return outcome(turnedBack(o, 'それはここにはない。'));
    }
  },
};
