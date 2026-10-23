import { describe, expect, it } from 'vitest';
import { buildUsageReport, LIMITS, sceneAppearance } from '../src/game/usage';
import { SCENES } from '../src/game/scenes';
import { WORDS } from '../src/game/words';

describe('言葉の使い道表', () => {
  const report = buildUsageReport();
  const word = (id: string) => report.words.find((w) => w.id === id)!;

  it('対象語と黒い言葉以外のすべての言葉が並ぶ', () => {
    const ids = WORDS.filter((w) => w.kind !== 'target' && w.kind !== 'black').map((w) => w.id);
    expect(report.words.map((w) => w.id)).toEqual(ids);
  });
  it('言葉を抜いた呪文と比べて、得になった場面を数える', () => {
    expect(word('ash').goodScenes).toContain('barn');
    expect(word('spear').goodScenes).toContain('crossroads');
    expect(word('quiet').goodScenes).toContain('bear');
  });
  it('目安から外れた言葉には警告がつく', () => {
    for (const w of report.words) {
      if (w.goodScenes.length < LIMITS.minScenes || w.versatility > LIMITS.maxVersatility) expect(w.warnings.length).toBeGreaterThan(0);
    }
  });
  it('故郷の場面は毎回の旅で必ず出会う', () => {
    const a = sceneAppearance(200);
    expect(a.rockfall).toBe(1);
    expect(a.imp).toBe(1);
    expect(Object.keys(SCENES).every((id) => a[id] >= 0 && a[id] <= 1)).toBe(true);
  });
});
