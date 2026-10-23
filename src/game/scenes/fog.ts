// 霧の森：濃い霧で道が見えない。抜けると「風」の言葉が手に入る

import { isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, type Outcome, type SceneDef } from '../scene';

const WIND_LINE = '森を抜けた風が、ひとつの言葉になって耳に届いた。';

function through(o: Outcome, summary: string, discovery: string, ...lines: string[]): Outcome {
  o.log.push(...lines, WIND_LINE);
  o.discoveries.push(discovery);
  o.summary = summary;
  o.reward = 'wind';
  return o;
}

function lost(o: Outcome, ...lines: string[]): Outcome {
  o.hearts -= 1;
  o.log.push(...lines, '霧の中で道に迷い、さんざん歩き回った。ハートを1つ失った。');
  o.summary = '霧の森で迷った';
  return o;
}

export const fog: SceneDef = {
  id: 'fog',
  title: '霧の森',
  kind: 'event',
  intro: () => ['森に入ると、真っ白な霧が立ちこめていた。', '一歩先も見えない。どこかでフクロウが鳴いている。'],
  objects: () => [
    { id: 'fog', label: '🌫️ 霧', keyword: '霧', desc: '肌にまとわりつくような濃い霧。', color: '#dfe3e8' },
    { id: 'lantern', label: '🏮 古いランタン', keyword: 'ランタン', desc: '木の枝に掛かっている。油はまだ残っている。', color: '#f2d27a' },
    { id: 'owl', label: '🦉 フクロウ', keyword: 'フクロウ', desc: '羽をけがしているようだ。', color: '#d6c4a8' },
  ],
  resolve(spell) {
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(lost(o, '呪文は霧に吸いこまれた。'));
    const target = spell.target ?? 'fog';

    switch (target) {
      case 'fog':
        if (spell.elements.includes('wind')) {
          return outcome(through(o, '風で霧を吹き払った', '風×霧：吹き払って道が見える',
            '風が霧を吹き払い、森の小道がくっきりと見えた。'));
        }
        if (spell.elements.includes('fire')) {
          return outcome(through(o, '炎で霧を晴らして進んだ', '炎×霧：熱で霧が晴れる',
            '炎の熱で、まわりの霧がすうっと晴れていく。'));
        }
        if (spell.elements.includes('thunder')) {
          o.discoveries.push('雷×霧：一瞬だけ道が見える');
          return outcome(lost(o, '稲光で一瞬だけ道が見えたが、すぐにまた真っ白になった。'));
        }
        return outcome(lost(o, '霧は少しゆれただけだった。'));
      case 'lantern':
        if (spell.elements.includes('fire')) {
          return outcome(through(o, 'ランタンを灯して霧の森を抜けた', '炎×ランタン：灯りで道が見える',
            'ランタンに火が灯り、霧の中にぼんやりと小道が浮かび上がった。'));
        }
        if (isAttack(spell)) return outcome(lost(o, 'ランタンが砕け散ってしまった。'));
        return outcome(lost(o, 'ランタンはゆらゆら揺れている。'));
      case 'owl':
        if (spell.supports.includes('heal')) {
          return outcome(through(o, 'フクロウを癒して道案内してもらった', '癒し×フクロウ：元気になって道案内してくれる',
            'フクロウは元気に羽ばたき、ついて来いというように鳴いた。', 'フクロウの声を頼りに、霧の森を抜けた。'));
        }
        if (isAttack(spell)) {
          o.discoveries.push('攻撃×フクロウ：飛び去ってしまう');
          return outcome(lost(o, 'フクロウはおびえて飛び去ってしまった。'));
        }
        return outcome(lost(o, 'フクロウは首をかしげている。'));
      default:
        return outcome(lost(o, 'それはここにはない。'));
    }
  },
};
