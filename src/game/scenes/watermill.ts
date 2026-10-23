// 凍った水車：冷えこんだ朝、村の水車が凍りついて粉がひけない

import { isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, REGRET_LINE, type Outcome, type SceneDef } from '../scene';

function turns(o: Outcome, line: string, discovery: string): Outcome {
  o.log.push(line, '水車がぎいっと回りはじめた！', '粉屋「助かった！ これで村のパンが焼ける」 粉屋は、水の流れを読むこつを教えてくれた。');
  o.reward = 'flow';
  o.discoveries.push(discovery);
  o.summary = '凍った水車を動かした';
  return o;
}

function stays(o: Outcome, ...lines: string[]): Outcome {
  o.log.push(...lines, '水車は凍ったまま動かない。粉屋はため息をついた。');
  o.summary = '水車は凍ったままだった';
  return o;
}

export const watermill: SceneDef = {
  id: 'watermill',
  title: '凍った水車',
  kind: 'event',
  intro: () => ['冷えこんだ朝。村の水車小屋の前で、粉屋が頭を抱えている。', '粉屋「水車が凍りついて、粉がひけないんだ」'],
  objects: () => [
    { id: 'mill', label: '⚙️ 凍った水車', keyword: '水車', desc: '羽根に分厚い氷がこびりついている。木でできているので、燃えやすそう。', color: '#cfe3ee' },
    { id: 'channel', label: '🧊 凍った水路', keyword: '水路', desc: '水路の表面が凍って、水が流れていない。氷は割れそうな厚さ。', color: '#bfe0f0' },
    { id: 'miller', label: '🧑‍🍳 粉屋', keyword: '粉屋', desc: '白い粉だらけの手をこすり合わせている。', color: '#efe6d2' },
  ],
  resolve(spell, ctx) {
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(stays(o, '呪文は何も起こさなかった。'));
    const target = spell.target ?? 'mill';
    const strongFire = spell.elements.includes('fire')
      && (spell.supports.includes('boost') || spell.supports.includes('echo') || spell.elements.length > 1 || spell.usedWordIds.includes('sparks'));

    switch (target) {
      case 'mill':
        if (strongFire) {
          o.log.push('炎が強すぎた！ 氷は溶けたが、水車の羽根が黒く焦げてしまった。', '粉屋「回ることは回るが……」');
          o.discoveries.push('強い炎×水車：溶けるが焦げてしまう');
          o.summary = '水車を焦がしながら動かした';
          return outcome(o);
        }
        if (spell.elements.includes('fire')) return outcome(turns(o, 'ほどよい炎が、羽根の氷をじわじわと溶かした。', '炎×水車：氷が溶けて回り出す'));
        if (spell.supports.includes('boost')) return outcome(turns(o, '水車がぐぐっと力をこめ、氷をばりばりと割った。', '強化×水車：力ずくで氷を割る'));
        if (spell.elements.includes('ice')) {
          o.discoveries.push('氷×水車：ますます凍る');
          return outcome(stays(o, '氷がもう一段分厚くなった。'));
        }
        if (isAttack(spell)) {
          o.discoveries.push('攻撃×水車：羽根が傷むだけ');
          return outcome(stays(o, '呪文が羽根に当たって、木くずが飛んだ。'));
        }
        return outcome(stays(o, '水車はぴくりとも動かない。'));
      case 'channel':
        if (spell.elements.includes('fire') || spell.supports.includes('flow')) {
          return outcome(turns(o, spell.supports.includes('flow') ? '✦ 氷の下の水が勢いよく流れ出した。' : '水路の氷が溶けて、水が流れ出した。', '炎・流れ×水路：水が流れて水車が回る'));
        }
        if (spell.shapes.includes('spear') || spell.elements.includes('thunder') || spell.elements.includes('earth')) {
          return outcome(turns(o, '水路の氷にひびが走り、ばりんと割れた。', '槍・雷・土×水路：氷が割れて水が流れる'));
        }
        if (spell.elements.includes('ice')) return outcome(stays(o, '水路の氷がさらに厚くなった。'));
        return outcome(stays(o, '水路の氷はびくともしない。'));
      case 'miller':
        if (isAttack(spell)) {
          if (!ctx.warned) return { kind: 'warning', message: '粉屋に向けて攻撃の呪文を唱えようとしている。本当に唱える？' };
          o.hearts -= 1;
          o.gainRegret = true;
          o.log.push('粉屋「ひいっ！」 粉屋は粉袋を投げつけて逃げていった。ハートを1つ失った。', REGRET_LINE);
          o.discoveries.push('攻撃×人：怒らせてしまう');
          o.summary = '粉屋を攻撃してしまった';
          return outcome(o);
        }
        if (spell.supports.includes('boost')) {
          return outcome(turns(o, '粉屋は腕まくりをして、木づちで氷を叩き割った。', '強化×粉屋：自分で氷を割る'));
        }
        if (spell.supports.includes('heal')) return outcome(stays(o, '粉屋のかじかんだ手が温まった。「ありがとう、でも水車が……」'));
        return outcome(stays(o, '粉屋はきょとんとしている。'));
      default:
        return outcome(stays(o, 'それはここにはない。'));
    }
  },
};
