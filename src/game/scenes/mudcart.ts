// ぬかるみの馬車：雨上がりの街道で、馬車の車輪がぬかるみにはまっている

import { isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, REGRET_LINE, type Outcome, type SceneDef } from '../scene';

function freed(o: Outcome, line: string, discovery: string): Outcome {
  o.log.push(line, '馬車がずるりとぬかるみを抜け出した！', '御者「恩に着るよ」 御者は、土を固めるこつを教えてくれた。');
  o.reward = 'earth';
  o.discoveries.push(discovery);
  o.summary = 'ぬかるみから馬車を出した';
  return o;
}

function stuck(o: Outcome, ...lines: string[]): Outcome {
  o.log.push(...lines, '車輪はますます深く沈んでいく。押すのを手伝ったが、泥だらけになっただけだった。');
  o.summary = '馬車はぬかるみにはまったままだった';
  return o;
}

export const mudcart: SceneDef = {
  id: 'mudcart',
  title: 'ぬかるみの馬車',
  kind: 'event',
  intro: () => ['雨上がりの街道。馬車の車輪が、ぬかるみに深くはまっている。', '御者「おーい、ちょいと手を貸してくれんか」'],
  objects: () => [
    { id: 'mire', label: '🟫 ぬかるみ', keyword: 'ぬかるみ', desc: 'どろどろにゆるんでいる。固まるか乾くかすれば、車輪がかかりそう。', color: '#b8a284' },
    { id: 'carriage', label: '🛞 馬車', keyword: '馬車', desc: '荷物を積んだ重い馬車。', color: '#d8c3a5' },
    { id: 'horse', label: '🐴 馬', keyword: '馬', desc: '疲れきって、足をふんばれずにいる。', color: '#d6b89a' },
  ],
  resolve(spell, ctx) {
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(stuck(o, '呪文は何も起こさなかった。'));
    const target = spell.target ?? 'mire';
    switch (target) {
      case 'mire':
        if (spell.elements.includes('ice') || spell.tricks.includes('frost')) return outcome(freed(o, 'ぬかるみがかちかちに凍りついた。', '氷・霜×ぬかるみ：固まって車輪がかかる'));
        if (spell.elements.includes('earth') && !spell.tricks.includes('mud')) return outcome(freed(o, '乾いた土がぬかるみを埋めた。', '土×ぬかるみ：埋めて固まる'));
        if (spell.tricks.includes('ash')) return outcome(freed(o, '✦ 灰が泥の水気を吸いこんだ。', '灰×ぬかるみ：水気を吸って固まる'));
        if (spell.elements.includes('fire') && spell.supports.includes('boost')) return outcome(freed(o, '強い炎がぬかるみを焼き固めた。', '強い炎×ぬかるみ：焼き固まる'));
        if (spell.elements.includes('fire')) {
          o.discoveries.push('炎×ぬかるみ：表面が乾くだけ');
          return outcome(stuck(o, 'ぬかるみの表面が少し乾いた。でも中はどろどろのままだ。'));
        }
        if (spell.shapes.includes('rain') || spell.supports.includes('flow') || spell.tricks.includes('mud')) {
          o.discoveries.push('水・泥×ぬかるみ：ますますゆるむ');
          return outcome(stuck(o, 'ぬかるみがますますゆるくなった。'));
        }
        return outcome(stuck(o, '泥がぴちゃりとはねた。'));
      case 'horse':
        if (spell.supports.includes('boost') || spell.supports.includes('heal')) {
          return outcome(freed(o, spell.supports.includes('boost') ? '馬が力強くいななき、ぐいっと馬車を引いた。' : '馬の疲れが取れて、もう一度ふんばった。', '強化・癒し×馬：力が戻って引き出せる'));
        }
        if (isAttack(spell)) {
          o.gainRegret = true;
          o.hearts -= 1;
          o.log.push('馬が驚いて暴れ、蹴られてしまった。ハートを1つ失った。', '御者「なにをするんだ！」', REGRET_LINE);
          o.discoveries.push('攻撃×馬：暴れてしまう');
          o.summary = '馬を驚かせてしまった';
          return outcome(o);
        }
        return outcome(stuck(o, '馬は鼻を鳴らした。'));
      case 'carriage':
        if (spell.supports.includes('pull') || spell.shapes.includes('chain')) {
          return outcome(freed(o, spell.shapes.includes('chain') ? '鎖を車輪に巻きつけ、みんなで引っぱった。' : '✦ 馬車がぐぐっとこちらへ引き寄せられた。', '引き寄せ・鎖×馬車：引っぱり出せる'));
        }
        if (spell.shapes.includes('wall')) return outcome(freed(o, '車輪の下から壁がせり上がり、馬車を持ち上げた。', '壁×馬車：下から持ち上がる'));
        if (isAttack(spell)) {
          o.discoveries.push('攻撃×馬車：荷物が傷むだけ');
          return outcome(stuck(o, '呪文が荷台に当たって、荷物が少し傷んだ。'));
        }
        return outcome(stuck(o, '馬車はびくともしない。'));
      default:
        void ctx;
        return outcome(stuck(o, 'それはここにはない。'));
    }
  },
};
