import { describe, expect, it } from 'vitest';
import { parseSpell } from '../src/game/parse';
import { resolveSceneA, type SceneAOutcome } from '../src/game/sceneA';
import { STARTING_WORDS } from '../src/game/words';

const owned = new Set(STARTING_WORDS);

function outcome(input: string, warned = false): SceneAOutcome {
  const r = resolveSceneA(parseSpell(input, owned), warned);
  if (r.kind !== 'outcome') throw new Error('warning returned');
  return r.outcome;
}

describe('場面A', () => {
  it('岩を砕くと女の子が加勢する', () => {
    const o = outcome('岩に雷槍');
    expect(o.girl).toBe('grateful');
    expect(o.gainRegret).toBe(false);
  });

  it('対象を省いた攻撃は落ちてくる岩に向かう', () => {
    expect(outcome('土槍').girl).toBe('grateful');
  });

  it('壁は岩を防ぎ、壁が残る', () => {
    const o = outcome('氷壁');
    expect(o.girl).toBe('walled');
    expect(o.wallStands).toBe(true);
  });

  it('女の子に強化すると自分で岩を砕く。属性も混ぜると暴走する', () => {
    expect(outcome('女の子に強化').girl).toBe('powered');
    expect(outcome('女の子に炎強化').girl).toBe('overcharged');
  });

  it('小川に氷で女の子が滑って逃げ、戦闘でも凍ったまま', () => {
    const o = outcome('小川に氷');
    expect(o.girl).toBe('escaped');
    expect(o.streamFrozen).toBe(true);
  });

  it('枯れ木に炎は煙で小鬼を弱らせるが、女の子は救えず後悔を得る', () => {
    const o = outcome('枯れ木に炎');
    expect(o.treeBurned).toBe(true);
    expect(o.girl).toBe('hurt');
    expect(o.gainRegret).toBe(true);
  });

  it('女の子への攻撃は初回に警告し、それでも唱えると後悔を得る', () => {
    const first = resolveSceneA(parseSpell('女の子に炎槍', owned), false);
    expect(first.kind).toBe('warning');
    const o = outcome('女の子に炎槍', true);
    expect(o.girl).toBe('angry');
    expect(o.gainRegret).toBe(true);
    expect(o.impStunned).toBe(true);
  });

  it('何も起きない呪文では岩が当たり後悔を得る', () => {
    const o = outcome('あいうえお');
    expect(o.girl).toBe('hurt');
    expect(o.gainRegret).toBe(true);
  });
});
