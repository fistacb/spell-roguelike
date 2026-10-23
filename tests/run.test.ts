import { describe, expect, it } from 'vitest';
import { cast, newRun, START_CHAR_LIMIT } from '../src/game/run';

describe('旅の進行', () => {
  it('文字数の上限を超えると唱えられない', () => {
    const r = cast(newRun(), '岩に炎槍雷刃雨');
    expect(r.error).toBeTruthy();
    expect(r.run.phase).toBe('sceneA');
  });

  it('場面Aを越えると戦闘に進み、上限が1増える', () => {
    const r = cast(newRun(), '岩に雷槍');
    expect(r.run.phase).toBe('battle');
    expect(r.run.charLimit).toBe(START_CHAR_LIMIT + 1);
  });

  it('後悔を得ると戦闘で使えるカードが増える', () => {
    const r = cast(newRun(), '枯れ木に炎');
    expect(r.run.owned).toContain('regret');
    expect(r.run.gainedWords).toEqual(['regret']);
  });

  it('人への攻撃は1度目は警告だけで、場面は進まない', () => {
    const r1 = cast(newRun(), '女の子に炎');
    expect(r1.warning).toBeTruthy();
    expect(r1.run.phase).toBe('sceneA');
    const r2 = cast(r1.run, '女の子に炎');
    expect(r2.run.phase).toBe('battle');
  });

  it('戦闘が終わると記録に進む', () => {
    let run = cast(newRun(), '女の子に強化').run;
    for (let i = 0; i < 10 && run.phase === 'battle'; i++) run = cast(run, '炎槍刃', () => 0.99).run;
    expect(run.phase).toBe('record');
  });
});
