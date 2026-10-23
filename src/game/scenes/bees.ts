// 暴れミツバチ：倒れた巣箱から、怒ったミツバチがあふれ出している

import { isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, REGRET_LINE, type Outcome, type SceneDef } from '../scene';

function calmed(o: Outcome, line: string, discovery: string): Outcome {
  o.log.push(line, 'ミツバチたちは巣箱へ帰っていった。', '養蜂家のおばあさん「助かったよ」 おばあさんは、蜂をなだめる煙の焚き方を教えてくれた。');
  o.reward = 'smoke';
  o.discoveries.push(discovery);
  o.summary = 'ミツバチを巣箱に帰した';
  return o;
}

function stung(o: Outcome, ...lines: string[]): Outcome {
  o.log.push(...lines, '怒ったミツバチに追い回されて、あちこち刺された。ハートを1つ失った。');
  o.hearts -= 1;
  o.summary = 'ミツバチに刺された';
  return o;
}

export const bees: SceneDef = {
  id: 'bees',
  title: '暴れミツバチ',
  kind: 'event',
  intro: () => ['村はずれの花畑で、ミツバチの巣箱が風で倒れている。', '怒ったミツバチがぶんぶん飛び回り、養蜂家のおばあさんが近づけずにいる。'],
  objects: () => [
    { id: 'bees', label: '🐝 ミツバチ', keyword: '蜂たち', desc: '気が立っている。煙や雨がくると、巣に帰りたがるらしい。', color: '#f0e2a8' },
    { id: 'hivebox', label: '📦 倒れた巣箱', keyword: '巣箱', desc: '横倒しになっている。起こしてやれば、蜂も落ち着きそう。', color: '#e2cfa8' },
    { id: 'straw', label: '🌾 濡れたわら', keyword: 'わら', desc: '朝露で湿ったわらの束。燃やすと、もくもく煙が出そう。', color: '#e8dca8' },
  ],
  resolve(spell, ctx) {
    void ctx;
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(stung(o, '呪文は何も起こさなかった。'));
    if (spell.tricks.includes('smoke') && !spell.elements.length) {
      return outcome(calmed(o, '✦ 煙がもくもくと流れ、ミツバチたちはおとなしくなった。', '煙×ミツバチ：おとなしくなる'));
    }
    const target = spell.target ?? (spell.shapes.includes('wall') ? 'hivebox' : 'bees');
    switch (target) {
      case 'straw':
        if (spell.elements.includes('fire')) return outcome(calmed(o, '湿ったわらがくすぶり、白い煙がもくもく立ちのぼった。', '炎×濡れたわら：煙が出て蜂がおとなしくなる'));
        return outcome(stung(o, 'わらがかさりと揺れた。'));
      case 'hivebox':
        if (spell.shapes.includes('wall') || spell.supports.includes('pull') || spell.supports.includes('boost') || spell.elements.includes('earth')) {
          return outcome(calmed(o, '巣箱がぐらりと起き上がり、元の台の上に収まった。', '壁・土・引き寄せ・強化×巣箱：起き上がって蜂が戻る'));
        }
        if (spell.elements.includes('fire')) {
          o.gainRegret = true;
          o.hearts -= 1;
          o.log.push('巣箱が燃えてしまった！ 怒り狂ったミツバチに刺されて、ハートを1つ失った。', REGRET_LINE);
          o.discoveries.push('炎×巣箱：燃えてしまう');
          o.summary = '巣箱を燃やしてしまった';
          return outcome(o);
        }
        return outcome(stung(o, '巣箱は倒れたままだ。'));
      case 'bees':
        // 雨が降ると、蜂は巣に帰る
        if (spell.shapes.includes('rain') && !spell.elements.includes('fire') && !spell.elements.includes('thunder')) {
          return outcome(calmed(o, 'ぱらぱらと雨が降り出した。ミツバチたちはあわてて巣箱へ逃げこんだ。', '雨×ミツバチ：巣に帰る'));
        }
        if (spell.elements.includes('ice') && spell.shapes.length === 0) {
          return outcome(calmed(o, 'ひやりとした風が吹き、ミツバチたちの羽音がのろくなった。', '氷×ミツバチ：冷えて動きがのろくなる'));
        }
        if (spell.supports.includes('sleep')) return outcome(calmed(o, 'ミツバチたちの羽音が、子守歌のようにゆっくりになった。', '眠り×ミツバチ：おとなしくなる'));
        if (isAttack(spell)) {
          o.gainRegret = true;
          o.hearts -= 1;
          o.log.push('呪文がミツバチの群れを打ち落とした。生き残った蜂に刺されて、ハートを1つ失った。', 'おばあさんが悲しそうにこちらを見ている。', REGRET_LINE);
          o.discoveries.push('攻撃×ミツバチ：傷つけてしまう');
          o.summary = 'ミツバチを傷つけてしまった';
          return outcome(o);
        }
        return outcome(stung(o, 'ミツバチたちはますます気が立った。'));
      default:
        return outcome(stung(o, 'それはここにはない。'));
    }
  },
};
