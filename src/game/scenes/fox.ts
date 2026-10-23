// 迷子の子ぎつね：穴に落ちた子ぎつねと、気が立っている母ぎつね

import { isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, REGRET_LINE, type Outcome, type SceneDef } from '../scene';

const THANKS = '母ぎつねは子ぎつねをくわえると、こちらに頭を下げて、木の実を置いていった。ハートが1つ増えた。';

function saved(o: Outcome, summary: string, discovery: string, ...lines: string[]): Outcome {
  o.log.push(...lines, THANKS);
  o.hearts += 1;
  o.discoveries.push(discovery);
  o.summary = summary;
  return o;
}

// 助けられないと、母ぎつねに追い払われる
function bitten(o: Outcome, ...lines: string[]): Outcome {
  o.hearts -= 1;
  o.log.push(...lines, '母ぎつねが毛を逆立てて飛びかかってきた！ かまれて、ハートを1つ失った。');
  o.summary = '母ぎつねにかまれた';
  return o;
}

export const fox: SceneDef = {
  id: 'fox',
  title: '迷子の子ぎつね',
  kind: 'event',
  intro: () => ['森の小道で、キュンキュンと鳴く声がする。', '深い穴の底に子ぎつねが落ちていて、穴のふちで母ぎつねがうなっている。'],
  objects: () => [
    { id: 'kit', label: '🦊 子ぎつね', keyword: '子ぎつね', desc: '穴の底で震えている。足をくじいているようだ。', color: '#f0c9a0' },
    { id: 'pit', label: '🕳️ 穴', keyword: '穴', desc: '深くて、壁はつるつるしている。', color: '#c9b9a0' },
    { id: 'vixen', label: '🦊 母ぎつね', keyword: '母ぎつね', desc: '気が立っている。近づくとかみつかれそう。', color: '#e8b98a' },
  ],
  resolve(spell) {
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(bitten(o, '呪文は何も起こさなかった。'));
    const target = spell.target ?? (isAttack(spell) ? 'vixen' : 'kit');

    switch (target) {
      case 'kit':
        if (spell.supports.includes('pull') && !isAttack(spell)) {
          return outcome(saved(o, '子ぎつねを引き寄せて助けた', '引き寄せ×子ぎつね：穴の底から引き上げる',
            '✦ 子ぎつねがふわりと浮かび上がり、穴の外へ出てきた！'));
        }
        if (spell.supports.includes('heal')) {
          return outcome(saved(o, '子ぎつねを癒して自力で出させた', '癒し×子ぎつね：足が治って自分で跳び出す',
            '子ぎつねの足が治った。', '子ぎつねはぴょんと跳ねて、穴から飛び出した！'));
        }
        if (spell.shapes.includes('chain') && !spell.elements.length) {
          return outcome(saved(o, '鎖を垂らして子ぎつねを助けた', '鎖×子ぎつね：かみついて登ってくる',
            '鎖を穴に垂らすと、子ぎつねがかみついた。', 'そっと引き上げた。'));
        }
        if (isAttack(spell)) {
          o.gainRegret = true;
          return outcome(bitten(o, '呪文が子ぎつねをかすめた。キャン！と悲鳴が上がった。', REGRET_LINE));
        }
        return outcome(bitten(o, '子ぎつねは穴の底で震えている。'));
      case 'pit':
        if ((spell.shapes.includes('wall') && (spell.elements.includes('earth') || spell.tricks.includes('mud')))
          || spell.elements.includes('earth') && !isAttack(spell)) {
          return outcome(saved(o, '穴の底を持ち上げて子ぎつねを助けた', '土×穴：底がせり上がる',
            '穴の底の土がもこもことせり上がり、子ぎつねが外へ出てきた。'));
        }
        if (spell.supports.includes('flow')) {
          return outcome(saved(o, '穴に水を流して子ぎつねを浮かせた', '流れ×穴：水が満ちて浮かび上がる',
            '✦ 穴に水が流れこみ、子ぎつねがぷかぷか浮かんできた。'));
        }
        if (spell.elements.includes('ice')) {
          o.discoveries.push('氷×穴：つるつるになってかえって登れない');
          return outcome(bitten(o, '穴の壁が凍って、ますますつるつるになった。'));
        }
        return outcome(bitten(o, '穴の土がぱらぱらと落ちた。'));
      case 'vixen':
        if (spell.supports.includes('heal') || spell.supports.includes('sleep')) {
          o.log.push(spell.supports.includes('sleep') ? '✦ 母ぎつねは丸くなって眠りこんだ。' : '母ぎつねの気持ちが少し落ち着いたようだ。');
          if (spell.supports.includes('sleep')) o.gainWords.push('quiet');
          o.log.push('その間に穴のふちに枝を差しこむと、子ぎつねがよじ登ってきた。', THANKS);
          o.hearts += 1;
          o.discoveries.push('眠り・癒し×母ぎつね：落ち着いて、子ぎつねを助けさせてくれる');
          o.summary = '母ぎつねを落ち着かせて子ぎつねを助けた';
          return outcome(o);
        }
        if (isAttack(spell)) {
          o.gainRegret = true;
          o.hearts -= 1;
          o.log.push('呪文が母ぎつねを打った。母ぎつねは子どもを置いて逃げていった……。', '逃げぎわにかまれて、ハートを1つ失った。', REGRET_LINE);
          o.discoveries.push('攻撃×母ぎつね：子どもを置いて逃げてしまう');
          o.summary = '母ぎつねを追い払ってしまった';
          return outcome(o);
        }
        return outcome(bitten(o, '母ぎつねはうなり声を上げている。'));
      default:
        if (spell.tricks.includes('smoke') || spell.tricks.includes('ash')) {
          return outcome(bitten(o, '母ぎつねは匂いで、こちらの居場所をすぐに見つけた。'));
        }
        return outcome(bitten(o, 'それはここにはない。'));
    }
  },
};
