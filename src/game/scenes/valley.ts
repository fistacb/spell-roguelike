// 山びこの谷：雪の積もった細い谷。大きな音を立てると雪崩が起きる。抜けると「響き」が手に入る

import { isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, type Outcome, type SceneDef } from '../scene';

const ECHO_LINE = '谷を抜けると、君の声が山に跳ね返ってきた。その響きが、ひとつの言葉になった。';

function through(o: Outcome, summary: string, discovery: string, ...lines: string[]): Outcome {
  o.log.push(...lines, ECHO_LINE);
  o.discoveries.push(discovery);
  o.summary = summary;
  o.reward = 'echo';
  return o;
}

export const valley: SceneDef = {
  id: 'valley',
  title: '山びこの谷',
  kind: 'event',
  intro: () => ['両側を崖にはさまれた、細い谷に入った。', '崖の上には雪がどっさり積もっている。小石が落ちる音さえ、何度も響いて返ってくる。'],
  objects: () => [
    { id: 'snow', label: '❄️ 崖の上の雪', keyword: '雪', desc: '今にも崩れそう。大きな音は禁物だ。', color: '#e6eef5' },
    { id: 'self', label: '🚶 自分', keyword: '自分', desc: 'ここを静かに抜けたい。', color: '#e8d7b5' },
  ],
  resolve(spell) {
    const o = emptyOutcome();
    if (spell.tricks.includes('quiet')) {
      return outcome(through(o, '静けさの中で谷を抜けた', '静けさ×谷：どんな呪文も音が立たない',
        '✦ あたりの音がすうっと消えた。', '雪はぴくりとも動かない。'));
    }
    if (spell.supports.includes('echo')) {
      o.hearts -= 2;
      o.log.push('呪文が谷じゅうに響きわたった！', 'ゴゴゴ……と雪崩が押し寄せ、ハートを2つ失った。');
      o.discoveries.push('響き×谷：雪崩が起きる');
      o.summary = '谷で雪崩を起こしてしまった';
      return outcome(o);
    }
    if ((spell.target === 'snow' || spell.target === null) && spell.elements.includes('fire') && !spell.shapes.some((s) => s !== 'wall')) {
      return outcome(through(o, '崖の雪を溶かしてから谷を抜けた', '炎×雪：静かに溶かせる',
        '炎の熱で、崖の上の雪がじわじわと溶けていく。', '雪どけ水が流れていくのを待って、谷を抜けた。'));
    }
    if (isAttack(spell)) {
      if (spell.shapes.includes('wall')) {
        o.log.push('呪文の音で雪崩が起きた！ でも壁がそれを受け止めた。');
        o.discoveries.push('壁×雪崩：受け止められる');
        return outcome(through(o, '壁で雪崩を受け止めて谷を抜けた', '攻撃×谷：音で雪崩が起きる'));
      }
      o.hearts -= 2;
      o.log.push('呪文の音が谷じゅうに響いた。', 'ゴゴゴ……と雪崩が押し寄せ、ハートを2つ失った。');
      o.discoveries.push('攻撃×谷：音で雪崩が起きる');
      o.summary = '谷で雪崩を起こしてしまった';
      return outcome(o);
    }
    if (spell.shapes.includes('wall')) {
      return outcome(through(o, '壁で雪をせき止めて谷を抜けた', '壁×谷：雪をせき止める',
        '崖の上に、そっと壁を立てた。', 'これで雪が崩れても大丈夫だ。'));
    }
    if (isEmpty(spell) || spell.supports.length > 0 || spell.tricks.length > 0) {
      if (spell.supports.includes('heal')) o.log.push('自分をそっと癒した。');
      return outcome(through(o, '息をひそめて谷を抜けた', '静かな呪文×谷：雪崩は起きない',
        '小さな声で唱えて、そろりそろりと谷を進んだ。'));
    }
    return outcome(through(o, '息をひそめて谷を抜けた', '静かな呪文×谷：雪崩は起きない'));
  },
};
