// 茨の門：森の小道が、びっしりと茂った茨でふさがれている

import { isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, REGRET_LINE, type Outcome, type SceneDef } from '../scene';

function opened(o: Outcome, line: string, discovery: string): Outcome {
  o.log.push(line, '茨の向こうに、小さな空き地があった。', '空き地の真ん中に、古い槍の穂先が刺さっていた。その鋭さを覚えた。');
  o.reward = 'spear';
  o.discoveries.push(discovery);
  o.summary = '茨の門を抜けた';
  return o;
}

function scratched(o: Outcome, ...lines: string[]): Outcome {
  o.log.push(...lines, '無理やり茨をかき分けて進んだ。とげだらけになって、ハートを1つ失った。');
  o.hearts -= 1;
  o.summary = '茨にひっかかれた';
  return o;
}

export const thorns: SceneDef = {
  id: 'thorns',
  title: '茨の門',
  kind: 'event',
  intro: () => ['森の小道が、びっしりと茂った茨でふさがれている。', '茨のあいだから、小鳥のさえずりが聞こえる。'],
  objects: () => [
    { id: 'thorn', label: '🌹 茨', keyword: '茨', desc: '太いとげのついた蔓。切りはらえば通れそう。中に小鳥の巣がある。', color: '#bcd6b0' },
    { id: 'birds', label: '🐦 小鳥', keyword: '小鳥', desc: '茨の中に巣をかけている。抜け道を知っていそうだ。', color: '#f0e2a8' },
    { id: 'oldtree', label: '🌳 古木', keyword: '古木', desc: '茨の上に枝を広げている。', color: '#a8c49a' },
  ],
  resolve(spell, ctx) {
    void ctx;
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(scratched(o, '呪文は何も起こさなかった。'));
    const target = spell.target ?? 'thorn';
    switch (target) {
      case 'thorn':
        if (spell.elements.includes('fire')) {
          o.hearts -= 1;
          o.gainRegret = true;
          o.log.push('茨は燃えたが、小鳥の巣まで焼けてしまった。親鳥が悲しそうに鳴いている。', '煙にまかれて、ハートを1つ失った。', REGRET_LINE);
          o.discoveries.push('炎×茨：小鳥の巣まで燃えてしまう');
          o.summary = '茨を巣ごと燃やしてしまった';
          return outcome(o);
        }
        if (spell.shapes.includes('blade')) return outcome(opened(o, '刃が茨をすぱすぱと切りはらい、巣のまわりだけ残した。', '刃×茨：切りはらえる'));
        if (spell.elements.includes('ice') || spell.tricks.includes('frost')) return outcome(opened(o, '茨が凍ってもろくなり、手で折れるようになった。', '氷・霜×茨：もろくなって折れる'));
        if (spell.shapes.includes('wall')) return outcome(opened(o, '茨の上に壁がせり上がり、乗りこえる踏み台になった。', '壁×茨：踏み台にして乗りこえる'));
        if (spell.supports.includes('boost') || spell.supports.includes('heal')) return outcome(scratched(o, '茨がますます太く伸びた。'));
        if (spell.shapes.includes('spear')) return outcome(scratched(o, '槍は茨に穴をあけたが、すぐ蔓にふさがれた。'));
        return outcome(scratched(o, '茨がざわざわ揺れた。'));
      case 'birds':
        if (spell.supports.includes('echo') || spell.supports.includes('heal') || spell.tricks.includes('quiet')) {
          return outcome(opened(o, '小鳥たちがさえずりながら飛び立ち、茨の根もとの細い抜け道を教えてくれた。', '響き・癒し・静けさ×小鳥：抜け道を教えてくれる'));
        }
        if (isAttack(spell)) {
          o.gainRegret = true;
          o.log.push('呪文が小鳥の巣をかすめた。小鳥たちは悲鳴を上げて飛び去った。', REGRET_LINE);
          o.discoveries.push('攻撃×小鳥：おびえさせてしまう');
          return outcome(scratched(o, '静まりかえった茨の前で、'));
        }
        return outcome(scratched(o, '小鳥は首をかしげた。'));
      case 'oldtree':
        if (spell.supports.includes('boost') || spell.supports.includes('pull')) {
          return outcome(opened(o, '古木の枝がぐうっと下りてきて、茨の上に橋をかけた。', '強化・引き寄せ×古木：枝の橋がかかる'));
        }
        if (isAttack(spell)) return outcome(scratched(o, '古木の枝が折れて、茨の上に落ちた。'));
        return outcome(scratched(o, '古木の葉がさらさら鳴った。'));
      default:
        return outcome(scratched(o, 'それはここにはない。'));
    }
  },
};
