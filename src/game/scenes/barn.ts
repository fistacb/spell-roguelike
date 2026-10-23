// 燃える納屋：村はずれの納屋が燃えていて、村人が困っている

import { isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, REGRET_LINE, type Outcome, type SceneDef } from '../scene';

function putOut(o: Outcome, line: string, discovery: string): Outcome {
  o.log.push(line, '火が消えた！ 村人がお礼に焼きりんごをくれた。ハートが1つ増えた。', '村人「力が湧くおまじないを教えてやろう」');
  o.reward = 'boost';
  o.hearts += 1;
  o.discoveries.push(discovery);
  o.gainWords.push('ash');
  o.summary = '納屋の火事を消した';
  return o;
}

function burnsDown(o: Outcome, ...lines: string[]): Outcome {
  o.log.push(...lines, '納屋は燃え落ちてしまった。村人はがっくりしている。');
  o.summary = '納屋は燃え落ちた';
  return o;
}

export const barn: SceneDef = {
  id: 'barn',
  title: '燃える納屋',
  kind: 'event',
  intro: () => ['村はずれで煙が上がっている。納屋が燃えているのだ！', '村人「だれか、手を貸してくれ！」'],
  objects: () => [
    { id: 'barn', label: '🔥 燃える納屋', keyword: '火事', desc: '火はまだ屋根の半分くらい。', color: '#f0b08a' },
    { id: 'villager', label: '🧑‍🌾 村人', keyword: '村人', desc: 'バケツを持っておろおろしている。', color: '#e8d7b5' },
    { id: 'well', label: '🪣 井戸', keyword: '井戸', desc: '水はたっぷりあるが、汲むのが追いつかない。', color: '#bfe0f0' },
  ],
  resolve(spell, ctx) {
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(burnsDown(o, '呪文は何も起こさなかった。'));
    const target = spell.target ?? (spell.supports.includes('heal') && !isAttack(spell) ? 'self' : 'barn');

    switch (target) {
      case 'barn': {
        if (spell.elements.includes('fire')) {
          o.hearts -= 1;
          o.gainRegret = true;
          o.log.push('火が一気に燃え広がった！ 熱気でハートを1つ失った。', '村人「なんてことを……」', REGRET_LINE);
          o.discoveries.push('炎×火事：燃え広がる');
          o.summary = '火事をひどくしてしまった';
          return outcome(o);
        }
        if (spell.elements.includes('ice')) return outcome(putOut(o, '冷たい氷が炎を包みこんだ。', '氷×火事：消える'));
        if (spell.tricks.includes('mud')) return outcome(putOut(o, '✦ 泥がどさっと火をおおった。', '泥×火事：かぶせて消せる'));
        if (spell.tricks.includes('ash')) return outcome(putOut(o, '✦ 灰が火をすっぽりと包みこんだ。', '灰×火事：包みこんで消せる'));
        if (spell.supports.includes('flow')) return outcome(putOut(o, '✦ 井戸の水が流れとなって、納屋に押し寄せた！', '流れ×火事：水を呼んで消せる'));
        if (spell.elements.includes('earth') && spell.shapes.some((s) => s !== 'wall')) {
          return outcome(putOut(o, '土が火の上にどさっとかぶさった。', '土×火事：かぶせて消せる'));
        }
        if (spell.shapes.includes('wall')) {
          o.log.push('壁が立ち上がり、火が隣の家に移るのを止めた。', '納屋は燃え落ちたが、村は無事だ。村人「助かったよ」');
          o.discoveries.push('壁×火事：燃え広がりを止める');
          o.summary = '壁で燃え広がりを止めた';
          return outcome(o);
        }
        if (spell.shapes.includes('rain')) {
          o.discoveries.push('雨（属性なし）×火事：少し弱まるだけ');
          return outcome(burnsDown(o, 'ぱらぱらと小雨が降った。火は少し弱まったが、消えはしない。'));
        }
        if (spell.elements.includes('thunder')) return outcome(burnsDown(o, '火花が散っただけだった。'));
        return outcome(burnsDown(o, '呪文は炎の中に消えた。'));
      }
      case 'well': {
        if (spell.supports.includes('boost')) {
          return outcome(putOut(o, '井戸から水が噴き上がり、雨のように納屋に降り注いだ！', '強化×井戸：水があふれ出す'));
        }
        if (spell.elements.includes('ice')) {
          o.discoveries.push('氷×井戸：凍って水が汲めなくなる');
          return outcome(burnsDown(o, '井戸が凍りついて、水が汲めなくなった。'));
        }
        return outcome(burnsDown(o, '井戸の水面がゆれただけだった。'));
      }
      case 'villager': {
        if (spell.supports.includes('boost')) {
          return outcome(putOut(o, '村人はものすごい速さでバケツを運び始めた！', '強化×村人：バケツ運びが速くなる'));
        }
        if (isAttack(spell)) {
          if (!ctx.warned) return { kind: 'warning', message: '村人に向けて攻撃の呪文を唱えようとしている。本当に唱える？' };
          o.hearts -= 1;
          o.gainRegret = true;
          o.log.push('村人「うわっ！ 何をする！」', '村人はくわを振り回して追いかけてきた。ハートを1つ失った。', '納屋は燃え落ちた。', REGRET_LINE);
          o.discoveries.push('攻撃×人：怒らせてしまう');
          o.summary = '村人を攻撃してしまった';
          return outcome(o);
        }
        if (spell.supports.includes('heal')) {
          return outcome(burnsDown(o, '村人の手のやけどが治った。「ありがとう、でも納屋が……」'));
        }
        return outcome(burnsDown(o, '村人はきょとんとしている。'));
      }
      case 'self':
        if (spell.supports.includes('heal')) {
          o.hearts += 1;
          return outcome(burnsDown(o, '自分を癒した。ハートが1つ増えた。'));
        }
        return outcome(burnsDown(o, '自分に呪文をかけている間に──'));
      default:
        return outcome(burnsDown(o, 'それはここにはない。'));
    }
  },
};
