// いたずら小鬼：落石の犯人。落石の場面の結果で条件が変わる

import { absorb, emptyOutcome, fight, outcome, spellMultiplier, type Enemy, type SceneDef } from '../scene';

const IMP: Enemy = { name: '小鬼', targets: ['imp'], toughness: 8, chainable: true };

export const imp: SceneDef = {
  id: 'imp',
  title: 'いたずら小鬼',
  kind: 'battle',
  intents: [
    { name: '土の投石', element: 'earth', hearts: 1, inWater: false, description: '崖の上から石を投げようとしている' },
    { name: '雷の体当たり', element: 'thunder', hearts: 2, inWater: true, charge: true, description: '小川を渡って体当たりしようとしている' },
  ],
  intro(flags) {
    const lines = ['崖の上から、岩を落とした犯人のいたずら小鬼が飛び降りてきた！'];
    if (flags.treeBurned) lines.push('小鬼は煙でむせていて、力が出ないようだ。');
    if (flags.streamFrozen) lines.push('小川は凍ったままだ。');
    if (flags.impStunned) lines.push('小鬼はさっきの騒ぎを見て笑い転げている。');
    const girl: Record<string, string> = {
      grateful: '女の子「わたしも戦う！」',
      powered: '女の子は腕まくりしている。「まかせて！」',
      overcharged: '女の子はまだ目がぐるぐるしている……。',
      walled: '女の子は壁の陰から見守っている。',
      escaped: '女の子は凍った小川の向こうで手を振っている。',
      dazed: '女の子はたんこぶをさすりながら石を拾った。',
      angry: '女の子はもういない。',
      hurt: '女の子はうずくまって動けない。',
    };
    if (flags.girl) lines.push(girl[flags.girl]);
    return lines;
  },
  objects: (flags) => [
    { id: 'imp', label: '👺 小鬼', keyword: '小鬼', desc: '岩を落とした犯人。', color: '#d9c2e8' },
    { id: 'girl', label: '👧 女の子', keyword: '女の子', desc: '近くの村の子ども。', color: '#f3c6c6' },
    flags.treeBurned
      ? { id: 'tree', label: '🔥 燃えた枯れ木', keyword: '枯れ木', desc: 'もくもくと煙を上げている。', color: '#f0b08a' }
      : { id: 'tree', label: '🌳 枯れ木', keyword: '枯れ木', desc: 'からからに乾いている。', color: '#cfe0b8' },
    flags.streamFrozen
      ? { id: 'stream', label: '🧊 凍った小川', keyword: '小川', desc: 'つるつるに凍っている。', color: '#cdeaf5' }
      : { id: 'stream', label: '🏞️ 小川', keyword: '小川', desc: '浅い小川が流れている。', color: '#bfe0f0' },
  ],
  resolve(spell, ctx) {
    const intent = ctx.intent!;
    const o = emptyOutcome();
    const flags = { ...ctx.flags };
    const mult = spellMultiplier(spell);
    let bonus = 0;

    // 場面のしかけ
    const touchesTree = spell.target === 'tree' || spell.shapes.includes('rain');
    const touchesStream = spell.target === 'stream' || spell.shapes.includes('rain');
    if (touchesTree && spell.elements.includes('fire') && !flags.treeBurned) {
      flags.treeBurned = true;
      o.gainWords.push('smoke');
      o.log.push('枯れ木が燃え上がった！ 煙で小鬼がむせている。');
      o.discoveries.push('炎×枯れ木：燃えて煙が出る（敵が弱る）');
    }
    if (touchesStream && spell.elements.includes('ice') && !flags.streamFrozen) {
      flags.streamFrozen = true;
      o.gainWords.push('frost');
      o.log.push('小川が凍りついた。');
      o.discoveries.push('氷×小川：凍って滑る地面になる');
    }
    if (spell.target === 'stream' && spell.elements.includes('thunder')) {
      if (intent.inWater && !flags.streamFrozen) {
        bonus += Math.ceil(8 * mult);
        o.log.push('小川に雷が走り、水の中の小鬼が感電した！');
        o.discoveries.push('雷×小川：水の中にいる者が感電する');
      } else {
        o.log.push('小川がバチバチと光った。でも誰も水に入っていない。');
      }
    }

    // 女の子の加勢
    const fighting = flags.girl === 'grateful' || flags.girl === 'powered' || flags.girl === 'dazed' || flags.girl === 'overcharged';
    const girlBoost = spell.target === 'girl' && spell.supports.includes('boost');
    if (girlBoost) o.log.push(fighting ? '女の子に力が満ちた！' : '女の子は戦えない。');
    const factor = girlBoost ? 2 : 1;
    if (flags.girl === 'grateful') { bonus += 2 * factor; o.log.push('女の子が石を投げた！'); }
    if (flags.girl === 'powered') { bonus += 4 * factor; o.log.push('女の子のげんこつ！'); }
    if (flags.girl === 'dazed') { bonus += 1 * factor; o.log.push('女の子がふらふらしながら石を投げた。'); }
    if (flags.girl === 'overcharged') {
      if (ctx.rng() < 0.3) {
        o.hearts -= 1;
        o.log.push('暴走した女の子のげんこつがこっちに飛んできた！ ハートを1つ失った。');
      } else {
        bonus += 5 * factor;
        o.log.push('暴走した女の子が小鬼を殴り飛ばした！');
      }
    }

    let noAttack: string | undefined;
    if (flags.impStunned) noAttack = '小鬼は笑い転げていて、攻撃してこなかった。';
    else if (intent.inWater && flags.streamFrozen) {
      noAttack = '小鬼は凍った小川ですべって転んだ！';
      o.discoveries.push('凍った小川：渡ろうとした者が転ぶ');
    }

    const thunderInWater = spell.elements.includes('thunder') && intent.inWater && !flags.streamFrozen && spell.target !== 'stream';
    const r = fight(spell, {
      enemy: IMP,
      intent,
      toughnessDown: flags.treeBurned ? 2 : 0,
      bonusDamage: bonus,
      extraMult: thunderInWater ? { mult: 2, line: '小川を渡っている小鬼が感電した！' } : undefined,
      noAttack,
      wallStands: flags.wallStands,
    });
    if (thunderInWater) o.discoveries.push('雷×小川を渡る敵：感電して2倍');
    absorb(o, r);
    o.flags = { ...flags, impStunned: false, wallStands: r.usedWall ? false : flags.wallStands };
    if (r.slept) {
      o.summary = '小鬼を眠らせて通り抜けた';
      return outcome(o);
    }
    if (r.hid) {
      o.summary = '灰にまぎれて小鬼から逃れた';
      return outcome(o);
    }
    o.summary = r.defeated ? '小鬼を懲らしめた' : '小鬼に逃げられた';
    if (!r.defeated) o.log.push('小鬼は「べーっだ！」と逃げていった。');
    else {
      o.log.push('小鬼は「ごめんなさーい！」と逃げていった。', '小鬼が鎖を落としていった。');
      o.reward = 'chain';
    }
    return outcome(o);
  },
};
