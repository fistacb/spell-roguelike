import { describe, expect, it } from 'vitest';
import { cast, MAX_HEARTS, newRun, START_CHAR_LIMIT, START_HEARTS } from '../src/game/run';
import { buildJourney, JOURNEY_LENGTH } from '../src/game/scenes';
import { STARTING_WORDS } from '../src/game/words';

const first = () => 0; // 予告は候補の1つめ
const journey = ['rockfall', 'imp', 'barn', 'wolves', 'slime'];

describe('旅の進行', () => {
  it('旅は5場面で、落石の次は必ず小鬼', () => {
    for (let seed = 0; seed < 20; seed++) {
      let x = seed / 20;
      const ids = buildJourney(() => (x = (x * 9301 + 0.4927) % 1));
      expect(ids).toHaveLength(JOURNEY_LENGTH);
      expect(ids[ids.indexOf('rockfall') + 1]).toBe('imp');
      expect(new Set(ids).size).toBe(JOURNEY_LENGTH);
    }
  });

  it('文字数の上限を超えると唱えられない', () => {
    const r = cast(newRun(first, journey), '岩に炎槍雷刃雨');
    expect(r.error).toBeTruthy();
    expect(r.run.index).toBe(0);
  });

  it('1回の詠唱で次の場面に進み、上限が1増える', () => {
    const r = cast(newRun(first, journey), '岩に雷槍');
    expect(r.run.index).toBe(1);
    expect(r.run.charLimit).toBe(START_CHAR_LIMIT + 1);
    expect(r.run.hearts).toBe(START_HEARTS + 1); // お礼のパン
  });

  it('人への攻撃は1度目は警告だけで、場面は進まない', () => {
    const r1 = cast(newRun(first, journey), '女の子に炎');
    expect(r1.warning).toBeTruthy();
    expect(r1.run.index).toBe(0);
    const r2 = cast(r1.run, '女の子に炎');
    expect(r2.run.index).toBe(1);
    expect(r2.run.owned).toContain('regret');
  });

  it('後悔を持ったまま悪いことを重ねると禁忌がつく', () => {
    let run = cast(newRun(first, ['rockfall', 'imp', 'barn', 'bear', 'slime']), '枯れ木に炎').run;
    run = cast(run, '炎槍', first).run;
    run = cast(run, '納屋に炎', first).run;
    expect(run.taboos).toHaveLength(1);
  });

  it('ハートが0になると疲れて故郷に帰る', () => {
    let run = newRun(first, ['bear', 'barn', 'rockfall', 'imp', 'slime']);
    run = { ...run, owned: [...run.owned, 'boost'] };
    run = cast(run, '熊に強化').run; // -2
    expect(run.hearts).toBe(START_HEARTS - 2);
    run = cast(run, '納屋に炎').run; // -1
    expect(run.phase).toBe('record');
    expect(run.result).toBe('tired');
  });

  it('5場面を終えると新しい旅へ', () => {
    let run = newRun(first, journey);
    for (const spell of ['岩に雷槍', '炎槍', '納屋に氷', '礫', '沼に氷']) run = cast(run, spell, first).run;
    expect(run.phase).toBe('record');
    expect(run.result).toBe('complete');
    expect(run.hearts).toBeLessThanOrEqual(MAX_HEARTS);
  });

  it('初期ワードは属性3つと形2つだけ', () => {
    expect(STARTING_WORDS).toEqual(['fire', 'ice', 'thunder', 'spear', 'wall']);
    expect(newRun(first, journey).owned).toEqual(STARTING_WORDS);
  });

  it('旅の中で出来事の言葉とお礼の言葉が増えていく', () => {
    let run = newRun(first, journey);
    run = cast(run, '岩に雷槍').run;
    expect(run.owned).toContain('gravel');
    expect(run.owned).toContain('heal');
    run = cast(run, '炎槍', first).run; // 女の子の加勢で小鬼を懲らしめる
    expect(run.owned).toContain('chain');
    expect(run.gainedWords).toEqual(['gravel', 'heal', 'chain']);
  });

  it('知らない言葉は唱えても何も起きない', () => {
    const r = cast(newRun(first, journey), '岩に刃');
    expect(r.run.owned).not.toContain('blade');
    expect(r.run.log.some((l) => l.includes('「刃」はまだ知らない言葉'))).toBe(true);
  });

  it('もう持っている言葉をもらったらハート+1', () => {
    let run = newRun(first, ['bear', 'barn', 'rockfall', 'imp', 'slime']);
    run = { ...run, owned: [...run.owned, 'earth'] };
    const hearts = run.hearts;
    run = cast(run, '壁').run;
    expect(run.hearts).toBe(hearts + 1);
  });
});
