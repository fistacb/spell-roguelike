// 吊り橋の狼：谷にかかる吊り橋の向こうから、狼の群れが迫ってくる

import { emptyOutcome, fight, outcome, spellMultiplier, type Enemy, type SceneDef } from '../scene';

// 群れなので、雨は全員に当たってよく効き、槍は1匹にしか当たらない
const WOLVES: Enemy = { name: '狼の群れ', targets: ['wolf'], toughness: 8, chainable: false, shapeMult: { rain: 2, spear: 0.5 } };

export const wolves: SceneDef = {
  id: 'wolves',
  title: '吊り橋の狼',
  kind: 'battle',
  intents: [
    { name: '氷の牙', element: 'ice', hearts: 1, inWater: false, description: '吊り橋を渡って噛みつこうとしている' },
    { name: '群れの突撃', element: 'earth', hearts: 2, inWater: true, description: '谷川を渡って一斉に突っ込もうとしている' },
  ],
  intro: () => ['谷にかかる吊り橋を渡りきったところで、遠吠えが聞こえた。', '向こう岸から狼の群れが迫ってくる！'],
  objects: () => [
    { id: 'wolf', label: '🐺 狼の群れ', keyword: '狼', desc: '3匹いる。1匹ずつ狙うより、まとめて攻撃したい。', color: '#c7cbd6' },
    { id: 'bridge', label: '🌉 吊り橋', keyword: '吊り橋', desc: '古いロープでできている。', color: '#d8c3a5' },
    { id: 'stream', label: '🏞️ 谷川', keyword: '谷川', desc: '橋の下を浅い川が流れている。', color: '#bfe0f0' },
  ],
  resolve(spell, ctx) {
    const intent = ctx.intent!;
    const o = emptyOutcome();

    if (spell.target === 'bridge' && (spell.elements.includes('fire') || spell.shapes.includes('blade'))) {
      const how = spell.elements.includes('fire') ? '燃え落ちた' : 'ロープが切れて落ちた';
      o.log.push(`吊り橋が${how}！ 狼たちは向こう岸で吠えるばかりだ。`, 'でも道もなくなった。遠回りして、ハートを1つ失った。');
      o.hearts -= 1;
      o.discoveries.push(`${spell.elements.includes('fire') ? '炎' : '刃'}×吊り橋：落ちる（追ってこられないが道も消える）`);
      o.summary = '吊り橋を落として逃げた';
      return outcome(o);
    }

    let bonus = 0;
    let frozen = false;
    if ((spell.target === 'stream' || spell.shapes.includes('rain')) && spell.elements.includes('ice')) {
      frozen = true;
      o.log.push('谷川が凍りついた。');
      o.discoveries.push('氷×谷川：凍って滑る地面になる');
    }
    if (spell.target === 'stream' && spell.elements.includes('thunder')) {
      if (intent.inWater) {
        bonus += Math.ceil(10 * spellMultiplier(spell));
        o.log.push('谷川に雷が走り、渡っていた狼たちが感電した！');
        o.discoveries.push('雷×谷川：渡っている群れがまとめて感電する');
      } else {
        o.log.push('谷川がバチバチと光った。でも狼は橋の上だ。');
      }
    }
    if (spell.shapes.includes('chain') && (spell.target === 'wolf' || spell.target === 'enemy' || spell.target === null)) {
      o.log.push('鎖で1匹は縛ったが、群れ全部は縛れない。');
    }

    const thunderInWater = spell.elements.includes('thunder') && intent.inWater && !frozen && spell.target !== 'stream';
    const r = fight(spell, {
      enemy: WOLVES,
      intent,
      bonusDamage: bonus,
      extraMult: thunderInWater ? { mult: 2, line: '谷川を渡る狼たちが感電した！' } : undefined,
      noAttack: intent.inWater && frozen ? '狼たちは凍った谷川で次々にすべって転んだ！' : undefined,
    });
    if (thunderInWater) o.discoveries.push('雷×川を渡る敵：感電して2倍');
    if (spell.shapes.includes('rain') && spell.target !== 'bridge') o.discoveries.push('雨×群れ：全員に当たってよく効く');
    o.log.push(...r.log);
    o.hearts += r.hearts;
    o.discoveries.push(...r.discoveries);
    o.summary = r.defeated ? '狼の群れを追い払った' : '狼の群れから逃げ切った';
    if (!r.defeated) o.log.push('なんとか狼をふりきって先へ進んだ。');
    return outcome(o);
  },
};
