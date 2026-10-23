// 吹雪の山小屋：山道で吹雪にあい、無人の山小屋に逃げこんだ

import { isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, type Outcome, type SceneDef } from '../scene';

function warm(o: Outcome, line: string, discovery: string): Outcome {
  o.log.push(line, '小屋の中がぽかぽかと暖まった。吹雪がやむまでぐっすり眠れた。ハートが1つ増えた。', '壁に、前の旅人が書き残した手当てのまじないがあった。');
  o.hearts += 1;
  o.reward = 'heal';
  o.discoveries.push(discovery);
  o.summary = '吹雪の山小屋で暖まった';
  return o;
}

function cold(o: Outcome, ...lines: string[]): Outcome {
  o.log.push(...lines, '一晩じゅう震えて過ごした。ハートを1つ失った。');
  o.hearts -= 1;
  o.summary = '山小屋で凍えた';
  return o;
}

export const blizzard: SceneDef = {
  id: 'blizzard',
  title: '吹雪の山小屋',
  kind: 'event',
  intro: () => ['山道で、ひどい吹雪になった。', '無人の山小屋に逃げこんだが、戸は壊れ、暖炉の火は消えている。'],
  objects: () => [
    { id: 'hearth', label: '🔥 暖炉', keyword: '暖炉', desc: '薪は少し残っている。', color: '#f0b08a' },
    { id: 'door', label: '🚪 壊れた戸口', keyword: '戸口', desc: '雪が吹きこんでくる。ふさげばましになりそう。', color: '#c9b9a0' },
    { id: 'blizzard', label: '🌨️ 吹雪', keyword: '吹雪', desc: 'ごうごうと荒れ狂っている。', color: '#e3edf5' },
  ],
  resolve(spell, ctx) {
    void ctx;
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(cold(o, '呪文は何も起こさなかった。'));
    const target = spell.target ?? (spell.elements.includes('fire') ? 'hearth' : 'door');
    switch (target) {
      case 'hearth':
        if (spell.elements.includes('fire') && isAttack(spell) && spell.shapes.length > 0) {
          o.log.push('勢いよく飛んだ炎が、暖炉から火の粉を散らした。床が少し焦げたが、なんとか火はついた。');
          return outcome(warm(o, '暖炉に火が入った。', '炎×暖炉：火が入る（形をつけると勢いがつきすぎる）'));
        }
        if (spell.elements.includes('fire') || spell.elements.includes('thunder')) return outcome(warm(o, '薪にぽっと火がついた。', '炎・雷×暖炉：火が入る'));
        if (spell.supports.includes('boost')) return outcome(cold(o, '残っていた燠火が少しだけ明るくなった。'));
        return outcome(cold(o, '冷たい灰が舞った。'));
      case 'door':
        if (spell.shapes.includes('wall') || spell.elements.includes('earth') || spell.elements.includes('ice') || spell.tricks.includes('mud')) {
          o.log.push('戸口がふさがって、雪が吹きこまなくなった。', '暖炉の火はつかなかったが、体を寄せ合うように丸まって眠った。');
          o.discoveries.push('壁・土・氷・泥×戸口：雪が入らなくなる');
          o.summary = '戸口をふさいで吹雪をしのいだ';
          return outcome(o);
        }
        return outcome(cold(o, '戸口から雪が吹きこみ続けている。'));
      case 'blizzard':
        if (spell.elements.includes('wind')) return outcome(cold(o, '風が吹雪をあおり、小屋の中まで雪が舞いこんだ！'));
        if (spell.elements.includes('fire')) return outcome(cold(o, '炎は吹雪にかき消された。'));
        if (spell.tricks.includes('quiet')) {
          o.log.push('✦ あたりがしんとした。吹雪の音がやわらいで、少し眠れた。');
          o.discoveries.push('静けさ×吹雪：音がやわらいで眠れる');
          o.summary = '静けさの中で吹雪をやり過ごした';
          return outcome(o);
        }
        return outcome(cold(o, '吹雪はびくともしない。'));
      default:
        return outcome(cold(o, 'それはここにはない。'));
    }
  },
};
