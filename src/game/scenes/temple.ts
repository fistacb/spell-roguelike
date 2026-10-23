// 雨宿りの廃寺：雷雨の中、街道沿いの古寺で雨宿りする

import { isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, type Outcome, type SceneDef } from '../scene';

function safe(o: Outcome, summary: string, discovery: string, ...lines: string[]): Outcome {
  o.log.push(...lines, '雷雨が過ぎるまで、ぐっすり休めた。ハートが1つ増えた。');
  o.hearts += 1;
  o.discoveries.push(discovery);
  o.summary = summary;
  return o;
}

function struck(o: Outcome, ...lines: string[]): Outcome {
  o.log.push(...lines, 'ドーン！ すぐそばの杉に雷が落ちた。破片が飛んできて、ハートを1つ失った。');
  o.hearts -= 1;
  o.summary = '廃寺で雷に肝を冷やした';
  return o;
}

export const temple: SceneDef = {
  id: 'temple',
  title: '雨宿りの廃寺',
  kind: 'event',
  intro: () => ['空が真っ暗になり、雷雨が来た。', '街道沿いの古い寺に駆けこんだ。屋根は穴だらけで、雷はどんどん近づいてくる。'],
  objects: () => [
    { id: 'tower', label: '🗼 古い塔', keyword: '塔', desc: '寺でいちばん高い塔。てっぺんに錆びた金の飾りがある。雷が落ちるならここに落ちてほしい。', color: '#d6d0c4' },
    { id: 'roof', label: '🏚️ 穴だらけの屋根', keyword: '屋根', desc: '雨がざあざあ漏れている。ふさげば休めそう。', color: '#c9b9a0' },
    { id: 'bell', label: '🔔 古い鐘', keyword: '鐘', desc: '大きな鐘。鳴らせばどこまでも響きそう。', color: '#e6d89c' },
  ],
  resolve(spell, ctx) {
    void ctx;
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(struck(o, '呪文は何も起こさなかった。'));
    const target = spell.target ?? (spell.shapes.includes('wall') ? 'self' : 'tower');
    switch (target) {
      case 'tower':
        if (spell.elements.includes('thunder')) {
          o.reward = 'echo';
          return outcome(safe(o, '雷を塔に誘って身を守った', '雷×塔：雷を引き受けてくれる',
            '✦ 塔のてっぺんに呪文の雷が走った。続く本物の雷も、次々と塔に吸いこまれていく！', '雷が去ったあと、鐘がひとりでに長く長く鳴り響いた。その響きを覚えた。'));
        }
        if (spell.supports.includes('boost')) {
          return outcome(safe(o, '塔を高くして雷をそらした', '強化×塔：高くなって雷を引き受ける', '塔がぐんと伸びた。雷はみんな塔に落ちていく。'));
        }
        if (isAttack(spell)) {
          o.discoveries.push('攻撃×塔：崩れてしまう');
          return outcome(struck(o, '塔のてっぺんが崩れ落ちた。'));
        }
        return outcome(struck(o, '塔はしんと立っている。'));
      case 'roof':
        if (spell.shapes.includes('wall') || spell.elements.includes('earth') || spell.tricks.includes('mud') || spell.elements.includes('ice')) {
          return outcome(safe(o, '屋根の穴をふさいで休んだ', '壁・土・泥・氷×屋根：穴がふさがる', '屋根の穴がふさがって、雨漏りが止まった。'));
        }
        if (spell.elements.includes('fire')) return outcome(struck(o, '屋根の木がくすぶりはじめた。あわてて消した。'));
        return outcome(struck(o, '雨漏りは止まらない。'));
      case 'self':
        if (spell.shapes.includes('wall')) {
          return outcome(safe(o, '壁に囲まれて雷雨をしのいだ', '壁×自分：雷からも雨からも守られる', '自分のまわりを壁で囲んだ。'));
        }
        if (spell.supports.includes('heal')) {
          o.hearts += 1;
          return outcome(struck(o, '自分を癒した。ハートが1つ増えた。'));
        }
        return outcome(struck(o, '自分に呪文をかけている間に──'));
      case 'bell':
        if (spell.supports.includes('echo') || spell.elements.includes('thunder')) {
          o.log.push('ゴーン……と鐘が鳴り響いた。', '近くの村から、蓑を着た村人たちが様子を見に来てくれた。村人の家で雨宿りさせてもらえた。');
          o.hearts += 1;
          o.discoveries.push('響き・雷×鐘：村人が気づいて来てくれる');
          o.summary = '鐘を鳴らして村人に助けてもらった';
          return outcome(o);
        }
        return outcome(struck(o, '鐘がかすかに揺れた。'));
      default:
        return outcome(struck(o, 'それはここにはない。'));
    }
  },
};
