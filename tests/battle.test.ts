import { describe, expect, it } from 'vitest';
import { createBattle, IMP_MAX_HP, PLAYER_MAX_HP, playTurn, type BattleState } from '../src/game/battle';
import { parseSpell } from '../src/game/parse';
import type { SceneAOutcome } from '../src/game/sceneA';
import { STARTING_WORDS } from '../src/game/words';

const owned = new Set([...STARTING_WORDS, 'regret']);
const never = () => 0.99;
const always = () => 0;

function scene(over: Partial<SceneAOutcome> = {}): SceneAOutcome {
  return {
    log: [], girl: 'hurt', treeBurned: false, streamFrozen: false, wallStands: false,
    impStunned: false, gainRegret: false, discoveries: [], ...over,
  };
}

function turn(state: BattleState, input: string, rng = never): BattleState {
  return playTurn(state, parseSpell(input, owned), rng);
}

describe('戦闘', () => {
  it('小鬼がまとう色と違う属性は等倍、同じ色は半減', () => {
    // 1ターン目の小鬼は土をまとっている
    expect(IMP_MAX_HP - turn(createBattle(scene()), '炎槍').impHp).toBe(6);
    expect(IMP_MAX_HP - turn(createBattle(scene()), '土槍').impHp).toBe(3);
  });

  it('無属性の攻撃は半減', () => {
    expect(IMP_MAX_HP - turn(createBattle(scene()), '槍').impHp).toBe(3);
  });

  it('小鬼の攻撃と同じ色の壁は攻撃をすべて防ぐ', () => {
    const s = turn(createBattle(scene()), '土壁');
    expect(s.playerHp).toBe(PLAYER_MAX_HP);
  });

  it('違う色の壁は3だけ防ぐ', () => {
    const s = turn(createBattle(scene()), '炎壁');
    expect(s.playerHp).toBe(PLAYER_MAX_HP - (5 - 3));
  });

  it('小川を渡る小鬼には雷が2倍効く。凍っていると効かない', () => {
    const s1 = turn(createBattle(scene()), '土壁'); // 2ターン目は雷の体当たり（小川）
    expect(IMP_MAX_HP - turn(s1, '雷槍').impHp).toBe(6); // 雷の色をまとっているので半減×感電2倍
    expect(IMP_MAX_HP - turn(s1, '炎槍').impHp).toBe(6);
    const frozen = turn(createBattle(scene({ streamFrozen: true })), '土壁');
    expect(IMP_MAX_HP - turn(frozen, '雷槍').impHp).toBe(3);
  });

  it('凍った小川では小鬼が転ぶことがある', () => {
    const s1 = turn(createBattle(scene({ streamFrozen: true })), '土壁');
    const s2 = turn(s1, '癒し', always);
    expect(s2.playerHp).toBe(PLAYER_MAX_HP);
  });

  it('鎖で縛ると次の行動を止めるが、続けては効かない', () => {
    const s1 = turn(createBattle(scene()), '鎖');
    expect(s1.playerHp).toBe(PLAYER_MAX_HP);
    const s2 = turn(s1, '鎖');
    expect(s2.impBound).toBe(false);
    expect(s2.playerHp).toBeLessThan(PLAYER_MAX_HP);
  });

  it('後悔は威力を2倍にするが自分も3傷つく', () => {
    const s = turn(createBattle(scene()), '後悔炎槍');
    expect(IMP_MAX_HP - s.impHp).toBe(12);
    expect(s.playerHp).toBe(PLAYER_MAX_HP - 3 - 5);
  });

  it('場面Aの壁は最初の攻撃を1回防ぐ', () => {
    const s = turn(createBattle(scene({ wallStands: true })), '癒し');
    expect(s.playerHp).toBe(PLAYER_MAX_HP);
    expect(s.wallStands).toBe(false);
  });

  it('枯れ木が燃えていると小鬼の攻撃が2下がる', () => {
    const s = turn(createBattle(scene({ treeBurned: true })), '癒し');
    expect(s.playerHp).toBe(PLAYER_MAX_HP - 3);
  });

  it('加勢した女の子が毎ターン攻撃する。強化すると2倍', () => {
    expect(IMP_MAX_HP - turn(createBattle(scene({ girl: 'grateful' })), '癒し').impHp).toBe(2);
    expect(IMP_MAX_HP - turn(createBattle(scene({ girl: 'grateful' })), '女の子に強化').impHp).toBe(4);
  });

  it('笑い転げている小鬼は最初の行動をしない', () => {
    const s = turn(createBattle(scene({ impStunned: true })), '癒し');
    expect(s.playerHp).toBe(PLAYER_MAX_HP);
  });

  it('小鬼を倒すと勝利', () => {
    let s = createBattle(scene({ girl: 'powered' }));
    for (let i = 0; i < 10 && !s.result; i++) s = turn(s, '炎槍刃');
    expect(s.result).toBe('win');
    expect(s.turn).toBeLessThanOrEqual(4);
  });
});
