// 茶屋の火鉢：雨の街道の茶屋で、ずぶぬれの客たちが震えている

import { isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, REGRET_LINE, type Outcome, type SceneDef } from '../scene';

function warmed(o: Outcome, line: string, discovery: string): Outcome {
  o.log.push(line, '茶屋の中がぽかぽか暖まった。客たちの顔に赤みがさした。', 'おかみさん「ありがとねえ」 おかみさんは、体を温める手当てのまじないを教えてくれた。');
  o.reward = 'heal';
  o.discoveries.push(discovery);
  o.summary = '茶屋の火鉢に火を入れた';
  return o;
}

function chilly(o: Outcome, ...lines: string[]): Outcome {
  o.log.push(...lines, '冷えた茶屋で、みんなで身を寄せ合って雨がやむのを待った。');
  o.summary = '茶屋は冷えたままだった';
  return o;
}

export const teahouse: SceneDef = {
  id: 'teahouse',
  title: '茶屋の火鉢',
  kind: 'event',
  intro: () => ['冷たい雨の街道で、小さな茶屋に駆けこんだ。', '中では、ずぶぬれの旅の客たちが震えている。おかみさん「炭がしけって、火がつかないんだよ」'],
  objects: () => [
    { id: 'charcoal', label: '⚫ しけった炭', keyword: '炭', desc: '雨で湿っている。火をつけても、くすぶって煙が出るだけかもしれない。乾かすか、強い火なら……。', color: '#9a9aa0' },
    { id: 'brazier', label: '🏺 火鉢', keyword: '火鉢', desc: '灰の中に、しけった炭が埋まっている。', color: '#c9b9a0' },
    { id: 'guests', label: '🧳 旅の客', keyword: '客', desc: '歯をがちがち鳴らしている。', color: '#d6d0c4' },
  ],
  resolve(spell, ctx) {
    void ctx;
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(chilly(o, '呪文は何も起こさなかった。'));
    const target = spell.target ?? (spell.supports.includes('heal') ? 'guests' : 'charcoal');
    const strong = spell.usedWordIds.includes('sparks') || spell.supports.includes('boost') || spell.supports.includes('echo')
      || (spell.elements.includes('fire') && spell.elements.includes('wind'));
    switch (target) {
      case 'charcoal':
      case 'brazier':
        if (spell.elements.includes('thunder') && !spell.shapes.includes('rain')) return outcome(warmed(o, 'ばちっ！ 雷が炭に火をつけた。炭は赤々と燃えはじめた。', '雷×しけった炭：いっきに火がつく'));
        if (spell.elements.includes('fire') && strong) return outcome(warmed(o, '勢いのある火が、しけった炭をいっきに燃え上がらせた。', '強い炎×しけった炭：燃え上がる'));
        if (spell.elements.includes('wind') && !spell.elements.includes('fire')) return outcome(chilly(o, '風が炭を乾かした。でも、火種がない。'));
        if (spell.elements.includes('fire')) {
          o.gainWords.push('smoke');
          o.log.push('炭がくすぶって、茶屋じゅうに煙がもうもうと立ちこめた。客たちがげほげほ咳きこんでいる。');
          o.discoveries.push('炎×しけった炭：くすぶって煙が出る');
          return outcome(chilly(o, '窓を開けて煙を出すと、また寒くなった。'));
        }
        if (spell.shapes.includes('rain') || spell.elements.includes('ice')) return outcome(chilly(o, '炭がますますしけってしまった。'));
        return outcome(chilly(o, '炭はしんと冷たい。'));
      case 'guests':
        if (spell.supports.includes('heal')) {
          o.hearts += 1;
          o.log.push('客たちの冷えた体が、ぽうっと温まった。', '客のひとりが、懐のおにぎりを分けてくれた。ハートが1つ増えた。');
          o.discoveries.push('癒し×旅の客：温まってお礼がもらえる');
          o.summary = '旅の客たちを温めた';
          return outcome(o);
        }
        if (isAttack(spell)) {
          o.gainRegret = true;
          o.hearts -= 1;
          o.log.push('客たちが悲鳴を上げて逃げまどい、茶屋から追い出された。雨の中を歩いて、ハートを1つ失った。', REGRET_LINE);
          o.discoveries.push('攻撃×人：怒らせてしまう');
          o.summary = '茶屋の客を攻撃してしまった';
          return outcome(o);
        }
        return outcome(chilly(o, '客たちは震えている。'));
      default:
        return outcome(chilly(o, 'それはここにはない。'));
    }
  },
};
