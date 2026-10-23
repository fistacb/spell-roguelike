// 分かれ道：ステージの終わりに、次に進む道を言葉で切り開く。街道はいつでも通れる

import { isAttack, type Spell } from '../parse';
import { emptyOutcome, outcome, type SceneDef, type SceneObject } from '../scene';
import type { TargetId } from '../words';
import { REGIONS, type RegionId } from './regions';

interface Road {
  region: RegionId;
  object: SceneObject;
  // この呪文で道が開くか
  opens(spell: Spell): boolean;
  openLine: string;
  discovery: string;
  // 効かなかったときの反応（呪文に応じて一言）
  miss(spell: Spell): string;
}

const ROADS: Road[] = [
  {
    region: 'mountain',
    object: { id: 'boulder', label: '🪨 山道をふさぐ大岩', keyword: '大岩', desc: 'ひびの入った大きな岩。突くか、揺さぶるか、どかしてしまえば通れそう。奥から獣の唸り声が聞こえる。', color: '#c9b9a0' },
    opens: (s) => (isAttack(s) && (s.shapes.includes('spear') || s.elements.includes('earth') || s.elements.includes('thunder')))
      || s.supports.includes('pull'),
    openLine: '大岩がごろりと動き、山道が開けた。',
    discovery: '槍・土・雷・引き寄せ×大岩：どかせて山道が開く',
    miss: (s) => isAttack(s) ? '呪文が大岩の表面ではじけた。もっと鋭く突くか、強く揺さぶらないと動かなさそうだ。' : '大岩はびくともしない。',
  },
  {
    region: 'river',
    object: { id: 'river', label: '🌊 川沿いの道を流す大川', keyword: '大川', desc: '冷たい水がゆったり流れている。足場か、流れの切れ目があれば渡れそう。向こう岸に渡し場の小屋が見える。', color: '#bfe0f0' },
    opens: (s) => s.elements.includes('ice') || s.tricks.includes('frost') || s.supports.includes('flow') || s.supports.includes('pull')
      || (s.elements.includes('earth') && s.shapes.includes('wall')),
    openLine: '大川に渡れる足場ができ、川沿いの道へ進めるようになった。',
    discovery: '氷・霜・流れ・引き寄せ・土の壁×大川：足場ができて渡れる',
    miss: (s) => s.elements.includes('fire') ? '大川から湯気が上がったが、流れは変わらない。' : '呪文は大川の流れに飲みこまれた。足場になるものがほしい。',
  },
  {
    region: 'forest',
    object: { id: 'fog', label: '🌫️ 森の入り口の霧', keyword: '霧', desc: '湿って重たい霧。熱か、空気の流れがあれば散りそう。奥からフクロウの声がする。', color: '#dfe3e8' },
    opens: (s) => s.elements.includes('wind') || s.elements.includes('fire') || s.supports.includes('flow') || s.usedWordIds.includes('storm'),
    openLine: '霧が晴れて、森の奥へ続く道が見えた。',
    discovery: '風・炎・流れ・嵐×霧：晴れて森の道が見える',
    miss: (s) => s.elements.includes('thunder') ? '霧の中で稲光がまたたいたが、霧はじっと動かない。' : s.elements.includes('ice') ? '霧が冷えて、ますます濃くなった。' : '霧は重たく垂れこめたままだ。',
  },
];

export const CROSSROADS_ID = 'crossroads';

/** まだ行っていない地域の道を並べた分かれ道を作る */
export function makeCrossroads(options: RegionId[]): SceneDef {
  const roads = ROADS.filter((r) => options.includes(r.region));
  return {
    id: CROSSROADS_ID,
    title: '分かれ道',
    kind: 'event',
    intro: () => [
      '道がいくつにも分かれている。',
      ...roads.map((r) => `${REGIONS[r.region].name}へ向かう道は、${r.object.keyword}でふさがれている。`),
      'ふさがれていない街道もある。',
    ],
    objects: () => roads.map((r) => r.object),
    resolve(spell) {
      const o = emptyOutcome();
      // 対象を言わなかったときは、呪文が効く道に向かう
      const road = roads.find((r) => (spell.target === null || spell.target === (r.object.id as TargetId)) && r.opens(spell));
      if (road) {
        o.log.push(road.openLine, `${REGIONS[road.region].name}へ進むことにした。`);
        o.discoveries.push(road.discovery);
        o.route = road.region;
        o.summary = `${REGIONS[road.region].name}への道を開いた`;
        return outcome(o);
      }
      // ねらった道（ねらいがなければ全部の道）が、呪文にどう反応したか
      const aimed = roads.filter((r) => spell.target === null || spell.target === (r.object.id as TargetId));
      o.log.push(...aimed.map((r) => r.miss(spell)), '道は開かなかった。', `${REGIONS.road.name}を進むことにした。`);
      o.route = 'road';
      o.summary = `${REGIONS.road.name}を進んだ`;
      return outcome(o);
    },
  };
}
