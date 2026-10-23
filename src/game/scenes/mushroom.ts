// 眠り茸の広場：密猟者が妖精を檻に閉じこめている。妖精を助けると「眠り」が手に入る

import { isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, REGRET_LINE, type Outcome, type SceneDef } from '../scene';

const SLEEP_LINE = '妖精「ありがとう！ お礼に、眠りの言葉をあげる」';

function freed(o: Outcome, summary: string, discovery: string, ...lines: string[]): Outcome {
  o.log.push(...lines, SLEEP_LINE);
  o.discoveries.push(discovery);
  o.summary = summary;
  o.reward = 'sleep';
  return o;
}

function leftBehind(o: Outcome, ...lines: string[]): Outcome {
  o.log.push(...lines, '密猟者ににらまれて、その場を離れるしかなかった。');
  o.summary = '妖精を助けられなかった';
  return o;
}

export const mushroom: SceneDef = {
  id: 'mushroom',
  title: '眠り茸の広場',
  kind: 'event',
  intro: () => ['森の奥の広場に、青白く光る茸がびっしり生えている。', '広場のすみで、男が妖精を檻に閉じこめていた。密猟者だ！'],
  objects: () => [
    { id: 'mushroom', label: '🍄 眠り茸', keyword: '眠り茸', desc: '触れると、眠くなる胞子をふわっと吐く。', color: '#d9c2e8' },
    { id: 'cage', label: '🪤 檻', keyword: '檻', desc: '妖精が閉じこめられている。鍵がかかっている。', color: '#d8c3a5' },
    { id: 'poacher', label: '🧔 密猟者', keyword: '密猟者', desc: 'ナイフを腰に下げている。こちらを警戒している。', color: '#e8d7b5' },
  ],
  resolve(spell, ctx) {
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(leftBehind(o, '呪文は何も起こさなかった。'));
    const target = spell.target ?? 'cage';

    switch (target) {
      case 'mushroom':
        if (spell.elements.includes('wind') || spell.tricks.includes('smoke')) {
          return outcome(freed(o, '眠り茸の胞子で密猟者を眠らせた', '風×眠り茸：胞子を飛ばして人を眠らせる',
            '✦ 胞子がふわりと舞い上がり、密猟者の方へ流れていった。', '密猟者は大あくびをして、その場に眠りこんだ。', 'その間に檻を開けた。'));
        }
        if (spell.elements.includes('fire') || isAttack(spell)) {
          o.hearts -= 1;
          o.log.push('眠り茸がはじけて、胞子が自分にもかかった！', '……気がつくと夕方だった。密猟者も妖精もいない。ハートを1つ失った。');
          o.discoveries.push('攻撃×眠り茸：胞子をかぶって眠ってしまう');
          o.summary = '眠り茸の胞子で眠ってしまった';
          return outcome(o);
        }
        return outcome(leftBehind(o, '茸がふるふると揺れただけだった。'));
      case 'cage':
        if (spell.supports.includes('pull')) {
          return outcome(freed(o, '檻を引き寄せて妖精を助けた', '引き寄せ×檻：手もとまで引き寄せる',
            '✦ 檻がすうっと手もとに飛んできた。', '密猟者が気づく前に、森の奥へ逃げて檻を開けた。'));
        }
        if (isAttack(spell)) {
          o.hearts -= 1;
          o.log.push('檻が壊れて、妖精が飛び出した！', '密猟者「この野郎！」 ナイフがかすめて、ハートを1つ失った。');
          return outcome(freed(o, '檻を壊して妖精を逃がした', '攻撃×檻：壊れるが、密猟者に気づかれる'));
        }
        return outcome(leftBehind(o, '檻はびくともしない。'));
      case 'poacher':
        if (spell.supports.includes('sleep') && !isAttack(spell)) {
          o.gainWords.push('quiet');
          return outcome(freed(o, '密猟者を眠らせて妖精を助けた', '眠り×密猟者：傷つけずに眠らせる',
            '✦ 密猟者はこっくりこっくりと船をこぎはじめた。', 'その間に檻を開けた。'));
        }
        if (spell.shapes.includes('chain') && spell.elements.length === 0) {
          return outcome(freed(o, '密猟者を鎖で縛って妖精を助けた', '鎖×人：傷つけずに縛る',
            '鎖が密猟者をぐるぐる巻きにした。', '「くそっ、ほどけ！」 わめく密猟者を横目に、檻を開けた。'));
        }
        if (isAttack(spell)) {
          if (!ctx.warned) return { kind: 'warning', message: '密猟者に向けて攻撃の呪文を唱えようとしている。本当に唱える？' };
          o.gainRegret = true;
          o.log.push('呪文が密猟者を打ち倒した。', '妖精は助かったが、倒れた男を見ると胸が痛んだ。', REGRET_LINE);
          o.discoveries.push('攻撃×人：助けられても、胸が痛む');
          o.summary = '密猟者を打ち倒した';
          return outcome(o);
        }
        return outcome(leftBehind(o, '密猟者「なんだ、手品か？」'));
      default:
        return outcome(leftBehind(o, 'それはここにはない。'));
    }
  },
};
