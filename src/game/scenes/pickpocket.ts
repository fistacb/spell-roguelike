// 市場のスリ：市場で、おばあさんの財布をすったスリが走って逃げる

import { isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, REGRET_LINE, type Outcome, type SceneDef } from '../scene';

function caught(o: Outcome, line: string, discovery: string): Outcome {
  o.log.push(line, '財布はおばあさんの手にもどった。', 'おばあさん「ありがとうよ」 おばあさんは、なくし物を手もとへ呼ぶおまじないを教えてくれた。');
  o.reward = 'pull';
  o.discoveries.push(discovery);
  o.summary = 'スリから財布を取りもどした';
  return o;
}

function escaped(o: Outcome, ...lines: string[]): Outcome {
  o.log.push(...lines, 'スリは人ごみにまぎれて消えてしまった。おばあさんはしょんぼりしている。');
  o.summary = 'スリに逃げられた';
  return o;
}

export const pickpocket: SceneDef = {
  id: 'pickpocket',
  title: '市場のスリ',
  kind: 'event',
  intro: () => ['にぎやかな街道の市場。', '「どろぼう！」 おばあさんの叫び声。財布をつかんだ男が、石畳の道を走って逃げていく！'],
  objects: () => [
    { id: 'thief', label: '🏃 スリ', keyword: 'スリ', desc: '石畳の上を全速力で走っている。足もとがすべれば転びそう。', color: '#c9c4b8' },
    { id: 'purse', label: '👛 財布', keyword: '財布', desc: 'スリの手に握られている。', color: '#e6c4a0' },
    { id: 'throng', label: '👥 人ごみ', keyword: '人ごみ', desc: '買い物客でごった返している。強い呪文はみんなを巻きこみそう。', color: '#d6d0c4' },
  ],
  resolve(spell, ctx) {
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(escaped(o, '呪文は何も起こさなかった。'));
    const target = spell.target ?? 'thief';
    if (target === 'throng' || (spell.shapes.includes('rain') && !spell.tricks.length)) {
      if (isAttack(spell)) {
        o.gainRegret = true;
        o.hearts -= 1;
        o.log.push('呪文が人ごみに降りそそぎ、買い物客たちが悲鳴を上げた！', 'スリにも逃げられ、町の人に責められた。ハートを1つ失った。', REGRET_LINE);
        o.discoveries.push('広がる攻撃×人ごみ：みんなを巻きこむ');
        o.summary = '人ごみを巻きこんでしまった';
        return outcome(o);
      }
      if (spell.supports.includes('echo')) return outcome(caught(o, '✦ 「どろぼう！」の声が市場じゅうに響きわたった。客たちがいっせいにスリを取り囲んだ。', '響き×人ごみ：みんなが気づいてくれる'));
      return outcome(escaped(o, '人ごみがざわざわした。'));
    }
    switch (target) {
      case 'thief':
        if (spell.tricks.includes('frost') || spell.tricks.includes('mud')) {
          return outcome(caught(o, '✦ 石畳がつるりとすべり、スリは派手にすっ転んだ。', '霜・泥×スリ：足をすべらせて転ぶ'));
        }
        if (spell.shapes.includes('chain') && !spell.elements.length) return outcome(caught(o, '鎖がスリの足にからみつき、その場に転がした。', '鎖×スリ：足をからめとる'));
        if (spell.shapes.includes('wall')) return outcome(caught(o, '路地の出口に壁がそびえ立った。スリは行き止まりで立ち往生した。', '壁×スリ：逃げ道をふさぐ'));
        if (spell.supports.includes('sleep')) return outcome(caught(o, '走っていたスリが、ふらふらと座りこんで眠ってしまった。', '眠り×スリ：走りながら眠る'));
        if (spell.supports.includes('pull')) return outcome(caught(o, '✦ スリの体がずるずると引き寄せられてきた。', '引き寄せ×スリ：連れもどせる'));
        if (isAttack(spell)) {
          if (!ctx.warned) return { kind: 'warning', message: 'スリに向けて攻撃の呪文を唱えようとしている。本当に唱える？' };
          o.gainRegret = true;
          o.log.push('呪文がスリに当たり、スリは石畳に倒れこんだ。', '財布はもどったが、倒れたスリを見て、おばあさんは顔をくもらせた。', REGRET_LINE);
          o.discoveries.push('攻撃×スリ：取りもどせるが、やりすぎてしまう');
          o.summary = 'スリを手荒に止めた';
          return outcome(o);
        }
        return outcome(escaped(o, 'スリはちらりと振り返った。'));
      case 'purse':
        if (spell.supports.includes('pull')) return outcome(caught(o, '✦ 財布がスリの手からすっぽ抜けて、こちらへ飛んできた。', '引き寄せ×財布：手もとへもどる'));
        if (spell.shapes.includes('blade')) return outcome(caught(o, '刃が財布のひもを切り、財布が石畳に落ちた。', '刃×財布：ひもが切れて落ちる'));
        if (spell.elements.includes('fire')) return outcome(escaped(o, '財布が焦げた。スリはあちちと言いながら走り去った。'));
        return outcome(escaped(o, '財布はスリの手の中だ。'));
      default:
        return outcome(escaped(o, 'それはここにはない。'));
    }
  },
};
