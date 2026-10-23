// 旅芸人の一座：街道の広場で、芸人たちの出し物が盛り上がらずに困っている

import { isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, REGRET_LINE, type Outcome, type SceneDef } from '../scene';

function cheered(o: Outcome, line: string, discovery: string): Outcome {
  o.log.push(line, '見物人から大きな拍手がわき起こった！', '座長「いやあ、大当たりだ！」 座長はおひねりの代わりに、旅の芸の言葉を分けてくれた。ハートが1つ増えた。');
  o.hearts += 1;
  o.reward = 'echo';
  o.discoveries.push(discovery);
  o.summary = '旅芸人の出し物を盛り上げた';
  return o;
}

function flat(o: Outcome, ...lines: string[]): Outcome {
  o.log.push(...lines, '見物人たちはあくびをして帰っていった。座長はがっかりしている。');
  o.summary = '出し物は盛り上がらなかった';
  return o;
}

export const performers: SceneDef = {
  id: 'performers',
  title: '旅芸人の一座',
  kind: 'event',
  intro: () => ['街道の広場で、旅芸人の一座が出し物をしている。', 'でも見物人はまばらで、みんな退屈そうだ。座長「何かぱっと派手なことはないかねえ」'],
  objects: () => [
    { id: 'stage', label: '🎪 舞台', keyword: '舞台', desc: '色あせた幕がかかっている。空に向かって何か打ち上げたら映えそう。', color: '#f0c8d0' },
    { id: 'juggler', label: '🤹 芸人', keyword: '芸人', desc: '玉を3つ投げている。4つ目は落としそう。', color: '#e6d89c' },
    { id: 'crowd', label: '👥 見物人', keyword: '見物人', desc: '遠くの人にはよく聞こえていないようだ。', color: '#d6d0c4' },
  ],
  resolve(spell, ctx) {
    void ctx;
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(flat(o, '呪文は何も起こさなかった。'));
    const target = spell.target ?? 'stage';
    switch (target) {
      case 'stage':
        if (spell.usedWordIds.includes('sparks') || (spell.elements.includes('fire') && spell.shapes.includes('rain'))) {
          return outcome(cheered(o, '✦ 色とりどりの火の粉が夜空に花開いた！', '火の粉・炎の雨×舞台：花火になる'));
        }
        if (spell.elements.includes('ice') && spell.shapes.length === 0) return outcome(cheered(o, '舞台の上に、きらきら光る氷の像が立ち上がった。', '氷×舞台：氷の像ができる'));
        if (spell.elements.includes('thunder') && !spell.shapes.includes('spear')) return outcome(cheered(o, '舞台の上で、小さな稲妻がぱちぱちと踊った。', '雷×舞台：稲妻が踊る'));
        if (spell.elements.includes('fire')) {
          o.discoveries.push('炎×舞台：幕が焦げる');
          return outcome(flat(o, '幕のすそが焦げて、座長があわてて火を消した。'));
        }
        if (isAttack(spell)) return outcome(flat(o, '舞台の床に穴があいた。'));
        return outcome(flat(o, '舞台の幕が少し揺れた。'));
      case 'juggler':
        if (spell.supports.includes('boost') || spell.supports.includes('pull')) {
          return outcome(cheered(o, '芸人の手さばきが冴えわたり、玉が10個、20個と宙を舞った！', '強化・引き寄せ×芸人：曲芸が冴える'));
        }
        if (isAttack(spell)) {
          o.gainRegret = true;
          o.log.push('芸人が玉を取り落として転んだ。見物人がひそひそ話している。', REGRET_LINE);
          o.discoveries.push('攻撃×芸人：けがをさせてしまう');
          o.summary = '芸人にけがをさせてしまった';
          return outcome(o);
        }
        return outcome(flat(o, '芸人はにこにこしている。'));
      case 'crowd':
        if (spell.supports.includes('echo')) return outcome(cheered(o, '✦ 座長の口上が、山びこのように広場じゅうに響きわたった。人がどんどん集まってくる。', '響き×見物人：声が遠くまで届く'));
        if (spell.elements.includes('wind')) return outcome(cheered(o, '風が一座の旗をはためかせ、街道じゅうの人が振り向いた。', '風×見物人：旗がはためいて人が集まる'));
        if (spell.supports.includes('sleep')) return outcome(flat(o, '見物人たちがうとうとしはじめた。'));
        return outcome(flat(o, '見物人はちらりとこちらを見た。'));
      default:
        return outcome(flat(o, 'それはここにはない。'));
    }
  },
};
