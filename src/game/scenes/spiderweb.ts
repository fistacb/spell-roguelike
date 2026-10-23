// 蜘蛛の巣の小道：森の小道が、大きな蜘蛛の巣でふさがれている

import { isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, REGRET_LINE, type Outcome, type SceneDef } from '../scene';

function through(o: Outcome, line: string, discovery: string, reward = true): Outcome {
  o.log.push(line, '小道が通れるようになった。');
  if (reward) {
    o.log.push('巣のそばに、切れ味のいい黒曜石の欠片が落ちていた。その鋭さを覚えた。');
    o.reward = 'blade';
  }
  o.discoveries.push(discovery);
  o.summary = '蜘蛛の巣の小道を抜けた';
  return o;
}

function tangled(o: Outcome, ...lines: string[]): Outcome {
  o.log.push(...lines, '糸に絡まりながら無理やり抜けた。大蜘蛛にかまれて、ハートを1つ失った。');
  o.hearts -= 1;
  o.summary = '蜘蛛の巣に絡まった';
  return o;
}

export const spiderweb: SceneDef = {
  id: 'spiderweb',
  title: '蜘蛛の巣の小道',
  kind: 'event',
  intro: () => ['森の小道が、大きな蜘蛛の巣でふさがれている。', '巣の真ん中で、大蜘蛛がじっとこちらをうかがっている。'],
  objects: () => [
    { id: 'web', label: '🕸️ 蜘蛛の巣', keyword: '蜘蛛の巣', desc: '太い糸が木から木へ張られている。切るか、吹き飛ばすか。燃やすと、まわりの木にも燃え移りそう。', color: '#e8e8e8' },
    { id: 'spider', label: '🕷️ 大蜘蛛', keyword: '蜘蛛', desc: '人の頭ほどもある。こちらから手を出さなければ、おとなしいようだ。', color: '#c7cbd6' },
    { id: 'trees', label: '🌲 木々', keyword: '木々', desc: '乾いた枝が多い。', color: '#bcd6b0' },
  ],
  resolve(spell, ctx) {
    void ctx;
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(tangled(o, '呪文は何も起こさなかった。'));
    const target = spell.target ?? 'web';
    switch (target) {
      case 'web':
        if (spell.elements.includes('fire')) {
          if (spell.shapes.includes('rain') || spell.elements.includes('ice')) {
            return outcome(through(o, '巣が燃え落ちた。火は木に燃え移る前に、しゅうっと消えた。', '炎＋水・氷×巣：燃え広がらずに焼き切れる'));
          }
          o.hearts -= 1;
          o.gainWords.push('smoke');
          o.log.push('巣は燃え落ちたが、火がまわりの枝に燃え移った！ 煙にまかれて、ハートを1つ失った。');
          return outcome(through(o, '火が収まるのを待って、焦げた小道を抜けた。', '炎×巣：燃えるが、森にも燃え移る', false));
        }
        if (spell.shapes.includes('blade') || spell.elements.includes('wind')) {
          return outcome(through(o, spell.shapes.includes('blade') ? '刃が糸をすぱすぱと切りはらった。' : '風が巣を吹き飛ばした。', '刃・風×巣：切れて通れる'));
        }
        if (spell.elements.includes('ice')) return outcome(through(o, '巣が凍って、ぱりんと砕けた。', '氷×巣：凍って砕ける'));
        if (spell.shapes.includes('spear')) return outcome(tangled(o, '槍が巣に穴をあけたが、糸がからみついて抜けない。'));
        return outcome(tangled(o, '巣がゆらゆら揺れた。'));
      case 'spider':
        if (spell.supports.includes('sleep') || spell.tricks.includes('smoke') || spell.tricks.includes('quiet')) {
          return outcome(through(o, '大蜘蛛はうとうとして、巣の隅で丸くなった。そのすきに巣の端をくぐった。', '眠り・煙・静けさ×大蜘蛛：おとなしくなる', false));
        }
        if (isAttack(spell)) {
          o.gainRegret = true;
          o.log.push('大蜘蛛は傷つき、森の奥へ逃げていった。巣の主のいない小道は、なんだか寂しい。', REGRET_LINE);
          return outcome(through(o, '主のいなくなった巣をくぐった。', '攻撃×大蜘蛛：おとなしい相手を傷つけてしまう', false));
        }
        if (spell.supports.includes('pull')) return outcome(tangled(o, '大蜘蛛がこちらへ引き寄せられて、顔に張りついた！'));
        return outcome(tangled(o, '大蜘蛛は脚を一本持ち上げた。'));
      case 'trees':
        if (spell.elements.includes('wind')) return outcome(through(o, '木々が大きく揺れて、巣が引きちぎれた。', '風×木々：揺れて巣がちぎれる'));
        if (spell.elements.includes('fire')) {
          o.hearts -= 1;
          o.gainRegret = true;
          o.log.push('乾いた枝が燃え上がった！ 森が焦げてしまった。ハートを1つ失った。', REGRET_LINE);
          o.discoveries.push('炎×木々：森が燃える');
          o.summary = '森を焦がしてしまった';
          return outcome(o);
        }
        return outcome(tangled(o, '木の葉がはらはらと落ちた。'));
      default:
        return outcome(tangled(o, 'それはここにはない。'));
    }
  },
};
