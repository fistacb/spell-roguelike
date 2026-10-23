// 網にかかったカワウソ：漁師の網に、カワウソがからまっている

import { isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, REGRET_LINE, type Outcome, type SceneDef } from '../scene';

function freed(o: Outcome, line: string, discovery: string): Outcome {
  o.log.push(line, 'カワウソはするりと川へ飛びこみ、くるりと一回転してみせた。', '川面に、流れの道すじが光って見えた。その流れ方を覚えた。');
  o.reward = 'flow';
  o.discoveries.push(discovery);
  o.summary = 'カワウソを網から放した';
  return o;
}

function stuck(o: Outcome, ...lines: string[]): Outcome {
  o.log.push(...lines, 'カワウソはますます網にからまった。戻ってきた漁師が、ぶつぶつ言いながらほどいてやった。');
  o.summary = 'カワウソを助けられなかった';
  return o;
}

export const otter: SceneDef = {
  id: 'otter',
  title: '網にかかったカワウソ',
  kind: 'event',
  intro: () => ['川岸に干された漁師の網に、カワウソがからまってもがいている。', '漁師は舟を出していて、まだ戻らない。'],
  objects: () => [
    { id: 'net', label: '🕸️ 漁網', keyword: '網', desc: '目の細かい丈夫な網。切るのがいちばん早そう。漁師の大事な道具でもある。', color: '#d6d0c4' },
    { id: 'otter', label: '🦦 カワウソ', keyword: 'カワウソ', desc: '暴れるほどからまっていく。落ち着かせられれば……。', color: '#c7a98a' },
    { id: 'fisher', label: '🚣 漁師', keyword: '漁師', desc: '川の上の舟にいる。声は届きそう。', color: '#e8d7b5' },
  ],
  resolve(spell, ctx) {
    void ctx;
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(stuck(o, '呪文は何も起こさなかった。'));
    const target = spell.target ?? (spell.shapes.includes('blade') ? 'net' : 'otter');
    switch (target) {
      case 'net':
        if (spell.shapes.includes('blade') && !spell.elements.includes('fire') && !spell.elements.includes('thunder')) {
          return outcome(freed(o, '刃が網の目をすっと一筋切りひらいた。', '刃×網：切りひらける'));
        }
        if (spell.supports.includes('pull')) return outcome(freed(o, '✦ 網がするすると手もとへ引き寄せられ、からまりを手でほどけた。', '引き寄せ×網：手もとでほどける'));
        if (spell.elements.includes('fire')) {
          o.hearts -= 1;
          o.gainRegret = true;
          o.log.push('網が燃え、カワウソの毛も焦げた。カワウソは悲鳴を上げて川へ逃げた。', '戻ってきた漁師「網が！」 弁償の代わりに、網の修理を手伝わされた。ハートを1つ失った。', REGRET_LINE);
          o.discoveries.push('炎×網：燃えてカワウソも焦げる');
          o.summary = '網を燃やしてしまった';
          return outcome(o);
        }
        if (spell.shapes.includes('spear')) return outcome(stuck(o, '網に小さな穴があいたが、カワウソは抜けられない。'));
        return outcome(stuck(o, '網がゆさゆさ揺れた。'));
      case 'otter':
        if (spell.supports.includes('heal') || spell.supports.includes('sleep') || spell.tricks.includes('quiet')) {
          return outcome(freed(o, 'カワウソはおとなしくなった。そっと網をほどいてやった。', '癒し・眠り・静けさ×カワウソ：落ち着いてほどける'));
        }
        if (spell.supports.includes('pull')) return outcome(stuck(o, 'カワウソを引っぱったら、網ごとずるずるついてきた。'));
        if (isAttack(spell)) {
          o.gainRegret = true;
          o.log.push('呪文がカワウソに当たった。カワウソはぐったりしてしまった。', REGRET_LINE);
          o.discoveries.push('攻撃×カワウソ：傷つけてしまう');
          o.summary = 'カワウソを傷つけてしまった';
          return outcome(o);
        }
        return outcome(stuck(o, 'カワウソはキュウキュウ鳴いている。'));
      case 'fisher':
        if (spell.supports.includes('echo') || spell.supports.includes('pull') || spell.supports.includes('flow')) {
          o.log.push(spell.supports.includes('echo') ? '✦ 呼び声が川面に響きわたった。' : '漁師の舟がすうっと岸へ寄ってきた。', '漁師「おお、すまんすまん」 漁師は手早く網をほどいてやった。', '漁師は、とれたての魚をごちそうしてくれた。ハートが1つ増えた。');
          o.hearts += 1;
          o.discoveries.push('響き・引き寄せ・流れ×漁師：呼び戻せる');
          o.summary = '漁師を呼び戻した';
          return outcome(o);
        }
        if (isAttack(spell)) {
          o.gainRegret = true;
          o.hearts -= 1;
          o.log.push('呪文が舟に当たって、漁師が川に落ちた！ 怒った漁師に追いかけられた。ハートを1つ失った。', REGRET_LINE);
          o.discoveries.push('攻撃×人：怒らせてしまう');
          o.summary = '漁師を攻撃してしまった';
          return outcome(o);
        }
        return outcome(stuck(o, '漁師は気づかない。'));
      default:
        return outcome(stuck(o, 'それはここにはない。'));
    }
  },
};
