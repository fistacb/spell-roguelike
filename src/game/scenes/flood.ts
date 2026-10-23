// 増水した川：濁流の中の岩に子どもが取り残されている。助けると「流れ」が手に入る

import { isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, REGRET_LINE, type Outcome, type SceneDef } from '../scene';

const FLOW_LINE = '子どもの母親「ありがとう！ 川の神さまのおまじないを教えてあげる」';

function rescued(o: Outcome, summary: string, discovery: string, ...lines: string[]): Outcome {
  o.log.push(...lines, FLOW_LINE);
  o.discoveries.push(discovery);
  o.summary = summary;
  o.reward = 'flow';
  return o;
}

// 助けられなかったときは、飛びこんで自分で連れ戻す
function jumpedIn(o: Outcome, ...lines: string[]): Outcome {
  o.hearts -= 1;
  o.log.push(...lines, 'しかたなく濁流に飛びこみ、なんとか子どもを連れ戻した。ハートを1つ失った。');
  o.summary = '濁流に飛びこんで子どもを連れ戻した';
  return o;
}

export const flood: SceneDef = {
  id: 'flood',
  title: '増水した川',
  kind: 'event',
  intro: () => ['大雨のあとで、川が茶色く荒れ狂っている。', '川の真ん中の岩に、子どもがしがみついている！ 古い橋は流されかけている。'],
  objects: () => [
    { id: 'child', label: '🧒 子ども', keyword: '子ども', desc: '岩にしがみついて泣いている。', color: '#f3c6c6' },
    { id: 'torrent', label: '🌊 濁流', keyword: '濁流', desc: '流れが速く、とても泳げそうにない。', color: '#c9c0a3' },
    { id: 'oldbridge', label: '🌉 古い橋', keyword: '古い橋', desc: '今にも崩れそうだが、子どもの岩の近くまで届いている。', color: '#d8c3a5' },
  ],
  resolve(spell, ctx) {
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(jumpedIn(o, '呪文は何も起こさなかった。'));
    const target = spell.target ?? (spell.supports.length > 0 && !isAttack(spell) ? 'child' : 'torrent');

    switch (target) {
      case 'child':
        if (spell.supports.includes('pull') && !isAttack(spell)) {
          return outcome(rescued(o, '子どもを引き寄せて助けた', '引き寄せ×子ども：濁流の上を飛んでくる',
            '✦ 子どもの体がふわりと浮き、濁流の上をこちらへ飛んできた！'));
        }
        if (spell.shapes.includes('chain')) {
          return outcome(rescued(o, '鎖を投げて子どもを助けた', '鎖×子ども：つかまらせて引き上げる',
            '鎖を投げると、子どもがしっかりとつかんだ。', 'ぐいぐいと引っぱって、岸まで連れ戻した。'));
        }
        if (spell.supports.includes('boost')) {
          return outcome(rescued(o, '子どもを強化して自力で戻らせた', '強化×子ども：自分で濁流を渡れるほど強くなる',
            '子どもは急に力がみなぎり、ざぶざぶと濁流を渡ってきた！'));
        }
        if (isAttack(spell)) {
          if (!ctx.warned) return { kind: 'warning', message: '子どもに向けて攻撃の呪文を唱えようとしている。本当に唱える？' };
          o.gainRegret = true;
          return outcome(jumpedIn(o, '呪文が子どものそばの岩を砕いた。子どもは濁流に投げ出された！', REGRET_LINE));
        }
        return outcome(jumpedIn(o, '子どもは岩にしがみついたままだ。'));
      case 'torrent':
        if (spell.elements.includes('ice') || spell.tricks.includes('frost')) {
          o.gainWords.push('frost');
          return outcome(rescued(o, '濁流を凍らせて子どもを助けた', '氷・霜×濁流：凍って歩いて渡れる',
            '濁流がばりばりと凍りついた。', '氷の上を歩いて、子どもを抱えて戻った。'));
        }
        if (spell.shapes.includes('wall') && (spell.elements.includes('earth') || spell.tricks.includes('mud'))) {
          return outcome(rescued(o, '土の壁で道を作って子どもを助けた', '土の壁×濁流：流れをせき止める道になる',
            '川底から土の壁がせり上がり、子どもの岩まで続く道になった。'));
        }
        if (spell.supports.includes('flow')) {
          return outcome(rescued(o, '流れを変えて子どもを助けた', '流れ×濁流：流れの向きを変える',
            '✦ 濁流がぐいっと向きを変え、子どもの岩のまわりだけ浅くなった。'));
        }
        return outcome(jumpedIn(o, '濁流は呪文をのみこんで、ますます荒れている。'));
      case 'oldbridge':
        if (spell.supports.includes('boost') || spell.shapes.includes('wall')) {
          return outcome(rescued(o, '古い橋を支えて子どもを助けた', '強化・壁×古い橋：崩れずに渡れる',
            '古い橋がぎしりと持ち直した。', '橋を渡って、子どもを抱えて戻った。'));
        }
        if (isAttack(spell)) {
          return outcome(jumpedIn(o, '古い橋はがらがらと崩れ落ちた。'));
        }
        return outcome(jumpedIn(o, '古い橋はぎしぎしと揺れている。'));
      default:
        return outcome(jumpedIn(o, 'それはここにはない。'));
    }
  },
};
