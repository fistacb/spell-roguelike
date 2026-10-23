// 盗賊の待ち伏せ：相手は人間。傷つけずに切り抜けるのが一番いい

import { isAttack } from '../parse';
import { emptyOutcome, absorb, fight, outcome, REGRET_LINE, type Enemy, type SceneDef } from '../scene';

const BANDITS: Enemy = { name: '盗賊たち', targets: ['bandit'], toughness: 8, chainable: true, shapeMult: { rain: 1.5 } };

export const bandits: SceneDef = {
  id: 'bandits',
  title: '盗賊の待ち伏せ',
  kind: 'battle',
  intents: [
    { name: '弓矢', element: 'earth', hearts: 1, inWater: false, description: '茂みの中から、弓で狙っている' },
    { name: '一斉に襲いかかる', element: 'thunder', hearts: 2, inWater: false, charge: true, description: '棍棒を振り上げて、一斉に走ってくる' },
  ],
  intro: () => ['街道の両側の茂みから、男たちが飛び出してきた。', '盗賊「おとなしく荷物を置いていきな！」'],
  objects: () => [
    { id: 'bandit', label: '🥷 盗賊たち', keyword: '盗賊', desc: '4人いる。人間だ。', color: '#c7cbd6' },
    { id: 'cart', label: '🛒 荷車', keyword: '荷車', desc: '盗賊たちがこれまでに奪った品が積んである。', color: '#d8c3a5' },
  ],
  resolve(spell, ctx) {
    const intent = ctx.intent!;
    const o = emptyOutcome();
    const atBandits = spell.target === 'bandit' || spell.target === 'enemy' || spell.target === null;

    if (spell.target === 'cart' && spell.elements.includes('fire')) {
      o.log.push('荷車に火がついた！', '盗賊「お宝が！」 盗賊たちはあわてて火を消しに走っていった。', 'その間に街道を駆け抜けた。');
      o.discoveries.push('炎×荷車：盗賊の気をそらせる');
      o.summary = '荷車に火をつけて盗賊の気をそらした';
      return outcome(o);
    }
    if (spell.target === 'cart' && spell.supports.includes('pull')) {
      o.log.push('✦ 荷車がごろごろとこちらへ転がってきた。', '盗賊「おい、返せ！」 荷車を盾にして、矢をかわしながら逃げ切った。');
      o.discoveries.push('引き寄せ×荷車：盾にして逃げられる');
      o.summary = '荷車を盾にして逃げ切った';
      return outcome(o);
    }
    if ((spell.tricks.includes('ash') || spell.tricks.includes('smoke')) && !isAttack(spell)) {
      o.log.push(spell.tricks.includes('ash') ? '✦ 灰を巻き上げて、足跡を消した。' : '✦ 煙があたりに立ちこめた。', '盗賊たちは見当違いの方向を探している。そのすきに逃げ切った。');
      o.discoveries.push('煙・灰×盗賊：見失わせて逃げ切る');
      o.summary = '盗賊たちをまいて逃げ切った';
      return outcome(o);
    }
    // 人を傷つける呪文は、一度ためらう
    if (atBandits && isAttack(spell) && !(spell.shapes.length > 0 && spell.shapes.every((s) => s === 'chain'))) {
      if (!ctx.warned) return { kind: 'warning', message: '盗賊たちとはいえ、人に向けて攻撃の呪文を唱えようとしている。本当に唱える？' };
    }

    const r = fight(spell, { enemy: BANDITS, intent });
    absorb(o, r);
    if (r.slept) {
      o.summary = '盗賊たちを眠らせて通り抜けた';
      return outcome(o);
    }
    if (r.hid) {
      o.summary = '灰にまぎれて盗賊たちから逃れた';
      return outcome(o);
    }
    const hurtPeople = r.damage > 0 && !(spell.shapes.length > 0 && spell.shapes.every((s) => s === 'chain'));
    if (hurtPeople) {
      o.gainRegret = true;
      o.log.push(REGRET_LINE);
      o.discoveries.push('攻撃×人：追い払えても、胸が痛む');
    }
    if (r.defeated) {
      o.log.push(spell.shapes.includes('chain') ? '盗賊たちをひとまとめに縛り上げて、街道の衛兵に引き渡した。' : '盗賊たちは散り散りに逃げていった。');
      o.summary = hurtPeople ? '盗賊たちを打ち倒した' : '盗賊たちを縛り上げた';
    } else {
      o.log.push('荷物を少し投げ出して、なんとか逃げ切った。');
      o.summary = '盗賊から逃げ切った';
    }
    return outcome(o);
  },
};
