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
}

const ROADS: Road[] = [
  {
    region: 'mountain',
    object: { id: 'boulder', label: '🪨 山道をふさぐ大岩', keyword: '大岩', desc: '山の方から、獣の唸り声が聞こえる。', color: '#c9b9a0' },
    opens: (s) => isAttack(s) && (s.shapes.includes('spear') || s.elements.includes('earth')),
    openLine: '大岩が砕け、山道が開けた。',
    discovery: '槍・土×大岩：砕けて山道が開く',
  },
  {
    region: 'river',
    object: { id: 'river', label: '🌊 川沿いの道を流す大川', keyword: '大川', desc: '向こう岸に、渡し場の小屋が見える。', color: '#bfe0f0' },
    opens: (s) => s.elements.includes('ice') || s.tricks.includes('frost'),
    openLine: '大川の浅瀬が凍りつき、川沿いの道へ渡れるようになった。',
    discovery: '氷・霜×大川：凍って向こう岸へ渡れる',
  },
  {
    region: 'forest',
    object: { id: 'fog', label: '🌫️ 森の入り口の霧', keyword: '霧', desc: '霧の奥から、フクロウの声がする。', color: '#dfe3e8' },
    opens: (s) => s.elements.includes('wind') || s.elements.includes('fire'),
    openLine: '霧が晴れて、森の奥へ続く道が見えた。',
    discovery: '風・炎×霧：晴れて森の道が見える',
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
      o.log.push('道は開かなかった。', `${REGIONS.road.name}を進むことにした。`);
      o.route = 'road';
      o.summary = `${REGIONS.road.name}を進んだ`;
      return outcome(o);
    },
  };
}
