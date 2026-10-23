// 狩人の罠：子鹿が罠にかかり、狩人が近づいてくる

import { ATTACK_SHAPES, isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, REGRET_LINE, type Outcome, type SceneDef } from '../scene';

function freed(o: Outcome, line: string, discovery: string): Outcome {
  o.log.push(line, '子鹿はぴょんと跳ねて、茂みで待っていた母鹿のもとへ駆けていった。', '母鹿は音も立てずに森の奥へ消えた。その静かな歩き方が、ひとつの言葉になった。');
  o.reward = 'quiet';
  o.discoveries.push(discovery);
  o.summary = '子鹿を罠から放した';
  return o;
}

function caught(o: Outcome, ...lines: string[]): Outcome {
  o.log.push(...lines, '狩人がやってきて、子鹿をかついで行ってしまった。');
  o.summary = '子鹿を助けられなかった';
  return o;
}

export const snare: SceneDef = {
  id: 'snare',
  title: '狩人の罠',
  kind: 'event',
  intro: () => ['森の中で、子鹿が足をくくり罠にとられてもがいている。', '遠くから、狩人の足音が近づいてくる。'],
  objects: () => [
    { id: 'snare', label: '🪢 くくり罠', keyword: '罠', desc: '丈夫な縄が杭につながっている。縄を切るか、杭を折れば外れそう。', color: '#d8c3a5' },
    { id: 'fawn', label: '🦌 子鹿', keyword: '子鹿', desc: 'おびえて暴れている。強い呪文が当たったら大けがをしそう。', color: '#e2c4a0' },
    { id: 'hunter', label: '🏹 狩人', keyword: '狩人', desc: 'まだこちらに気づいていない。', color: '#c9c4b8' },
  ],
  resolve(spell, ctx) {
    void ctx;
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(caught(o, '呪文は何も起こさなかった。'));
    const shaped = spell.shapes.some((s) => ATTACK_SHAPES.includes(s));
    const target = spell.target ?? (shaped ? 'snare' : 'fawn');
    switch (target) {
      case 'snare':
        if (spell.shapes.includes('blade') && !spell.elements.includes('fire')) return outcome(freed(o, '刃が縄をぷつりと断ち切った。', '刃×罠：縄が切れる'));
        if (spell.shapes.includes('spear') && !spell.elements.includes('fire')) return outcome(freed(o, '槍が杭をへし折った。', '槍×罠：杭が折れる'));
        if (spell.elements.includes('ice') || spell.tricks.includes('frost')) return outcome(freed(o, '縄が凍ってもろくなり、子鹿が引っぱるとぱきんと切れた。', '氷・霜×罠：縄がもろくなる'));
        if (spell.elements.includes('fire')) {
          o.gainRegret = true;
          o.log.push('縄は焼き切れたが、子鹿の足までやけどしてしまった。', '子鹿は足を引きずって逃げていった。', REGRET_LINE);
          o.discoveries.push('炎×罠：子鹿までやけどする');
          o.summary = '子鹿にやけどをさせてしまった';
          return outcome(o);
        }
        if (spell.supports.includes('pull')) return outcome(caught(o, '罠がぴんと張って、子鹿が悲鳴を上げた。'));
        return outcome(caught(o, '縄がぎしぎし鳴った。'));
      case 'fawn':
        if (spell.supports.includes('heal') || spell.supports.includes('sleep') || spell.tricks.includes('quiet')) {
          return outcome(freed(o, '子鹿がおとなしくなった。そのすきに、そっと縄をほどいた。', '癒し・眠り・静けさ×子鹿：落ち着いてほどける'));
        }
        if (isAttack(spell)) {
          o.gainRegret = true;
          o.log.push('呪文が子鹿に当たってしまった……。', REGRET_LINE);
          o.discoveries.push('攻撃×子鹿：傷つけてしまう');
          return outcome(caught(o, '倒れた子鹿のもとへ、'));
        }
        return outcome(caught(o, '子鹿はおびえた目でこちらを見ている。'));
      case 'hunter':
        if (spell.supports.includes('sleep') || spell.tricks.includes('smoke') || spell.tricks.includes('quiet') || spell.tricks.includes('ash')) {
          o.log.push('狩人の足音が止まった。', 'そのあいだに、ゆっくり縄をほどいてやった。');
          return outcome(freed(o, '子鹿は落ち着きを取り戻した。', '眠り・煙・静けさ・灰×狩人：時間をかせげる'));
        }
        if (spell.supports.includes('echo')) return outcome(caught(o, '響いた声に、狩人が「おや？」とこちらへ急いだ。'));
        if (isAttack(spell)) {
          o.gainRegret = true;
          o.hearts -= 1;
          o.log.push('狩人「何をする！」 矢を射かけられて、ハートを1つ失った。', REGRET_LINE);
          o.discoveries.push('攻撃×人：怒らせてしまう');
          o.summary = '狩人とけんかになった';
          return outcome(o);
        }
        return outcome(caught(o, '狩人の足音が近づいてくる。'));
      default:
        return outcome(caught(o, 'それはここにはない。'));
    }
  },
};
