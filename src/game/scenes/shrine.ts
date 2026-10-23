// 森の祠：苔むした祠の前で、石の番人が道をふさいでいる

import { ATTACK_SHAPES, isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, REGRET_LINE, type Outcome, type SceneDef } from '../scene';

function opened(o: Outcome, line: string, discovery: string): Outcome {
  o.log.push(line, '石の番人がゆっくりと脇へよけ、森の奥への道を開けてくれた。', '番人「静かなる者よ、これを持ってゆけ」 番人は、ものを眠らせる古い言葉を授けてくれた。');
  o.reward = 'sleep';
  o.discoveries.push(discovery);
  o.summary = '祠の番人に道を開けてもらった';
  return o;
}

function refused(o: Outcome, ...lines: string[]): Outcome {
  o.log.push(...lines, '番人は動かない。しかたなく、藪をかき分けて遠回りした。');
  o.summary = '祠の前を遠回りした';
  return o;
}

export const shrine: SceneDef = {
  id: 'shrine',
  title: '森の祠',
  kind: 'event',
  intro: () => ['森の奥に、苔むした小さな祠がある。', '祠の前で、石の番人が目を開いた。「騒がしき者は通さぬ」'],
  objects: () => [
    { id: 'warden', label: '🗿 石の番人', keyword: '番人', desc: '大きな石像。騒がしいものが嫌いらしい。手荒なことをすれば、ただでは済まなそう。', color: '#c9c4b8' },
    { id: 'shrine', label: '⛩️ 祠', keyword: '祠', desc: '屋根が傾き、灯明も消えている。', color: '#e0c9b0' },
    { id: 'offering', label: '🍶 供え物台', keyword: '供え物', desc: '何も供えられていない。', color: '#efe6d2' },
  ],
  resolve(spell, ctx) {
    void ctx;
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(refused(o, '呪文は何も起こさなかった。'));
    // 形のついた攻撃は番人に向かう。炎だけなら灯明にともる
    const shaped = spell.shapes.some((s) => ATTACK_SHAPES.includes(s));
    const target = spell.target ?? (shaped ? 'warden' : 'shrine');
    if (spell.tricks.includes('quiet') && !isAttack(spell)) return outcome(opened(o, '✦ あたりがしんと静まりかえった。', '静けさ×番人：静かな者として認められる'));
    switch (target) {
      case 'warden':
        if (isAttack(spell) || spell.supports.includes('echo')) {
          o.hearts -= 2;
          o.gainRegret = isAttack(spell);
          o.log.push(isAttack(spell) ? '呪文が番人の体にはじかれた。' : '呪文の響きが森じゅうにこだました。', '番人「騒がしき者よ！」 森の木々がざわめき、枝に打たれてハートを2つ失った。',
            ...(isAttack(spell) ? [REGRET_LINE] : []));
          o.discoveries.push('攻撃・響き×番人：祟られる');
          o.summary = '祠の番人の怒りに触れた';
          return outcome(o);
        }
        if (spell.supports.includes('heal')) return outcome(opened(o, '番人の体のひびが、すうっとふさがった。', '癒し×番人：ひびが治って喜ぶ'));
        if (spell.supports.includes('sleep')) return outcome(refused(o, '番人は石なので、眠らない。'));
        return outcome(refused(o, '番人はじっとこちらを見ている。'));
      case 'shrine':
        if (spell.elements.includes('fire') && !shaped) return outcome(opened(o, '祠の灯明に、ぽっと小さな火がともった。', '炎×祠：灯明がともる'));
        if (spell.elements.includes('fire')) {
          o.hearts -= 1;
          o.log.push('祠の屋根が燃えてしまった！ あわてて消したが、手をやけどしてハートを1つ失った。');
          o.discoveries.push('形のある炎×祠：燃えてしまう');
          o.summary = '祠を焦がしてしまった';
          return outcome(o);
        }
        if (spell.shapes.includes('wall') || spell.elements.includes('earth') || spell.supports.includes('boost')) {
          return outcome(opened(o, '傾いた祠がまっすぐに立ち直った。', '壁・土・強化×祠：立ち直る'));
        }
        return outcome(refused(o, '祠はしんとしている。'));
      case 'offering':
        if (spell.elements.includes('ice') && !isAttack(spell)) return outcome(opened(o, '供え物台に、澄んだ氷の玉がころんと載った。', '氷×供え物台：氷の玉を供える'));
        if (spell.shapes.includes('rain') && !spell.elements.length) return outcome(opened(o, '供え物台に、きれいな水がたまった。', '雨×供え物台：水を供える'));
        return outcome(refused(o, '供え物台は空のままだ。'));
      default:
        return outcome(refused(o, 'それはここにはない。'));
    }
  },
};
