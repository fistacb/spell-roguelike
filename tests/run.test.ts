import { describe, expect, it } from 'vitest';
import { cast, currentScene, INN_HEARTS, MAX_HEARTS, newRun, START_CHAR_LIMIT, START_HEARTS, type RunState } from '../src/game/run';
import { buildStage, SCENES, STAGE_COUNT, STAGE_LENGTH } from '../src/game/scenes';
import { STARTING_WORDS } from '../src/game/words';

const first = () => 0; // 予告は候補の1つめ
const stage1 = ['rockfall', 'imp', 'barn'];

function seeded(seed: number) {
  let x = seed / 20;
  return () => (x = (x * 9301 + 0.4927) % 1);
}

// 呪文を順に唱える
function play(run: RunState, spells: string[]): RunState {
  for (const s of spells) run = cast(run, s, first).run;
  return run;
}

describe('ステージの組み立て', () => {
  it('故郷のステージには落石と小鬼が続けて入る', () => {
    for (let seed = 0; seed < 20; seed++) {
      const ids = buildStage('home', [], seeded(seed));
      expect(ids).toHaveLength(STAGE_LENGTH);
      expect(ids[ids.indexOf('rockfall') + 1]).toBe('imp');
    }
  });
  it('地域の場面を優先し、すでに起きた場面は選ばない', () => {
    const ids = buildStage('mountain', ['barn'], first);
    expect(ids).toContain('bear');
    expect(ids).toContain('wolves');
    expect(ids).not.toContain('barn');
    expect(ids).not.toContain('rockfall');
  });
  it('3ステージ分の場面が足りる', () => {
    expect(Object.keys(SCENES).length).toBeGreaterThanOrEqual(STAGE_COUNT * STAGE_LENGTH);
  });
});

describe('旅の進行', () => {
  it('文字数の上限を超えると唱えられない', () => {
    const r = cast(newRun(first, stage1), '岩に炎槍雷刃雨');
    expect(r.error).toBeTruthy();
    expect(r.run.index).toBe(0);
  });

  it('1回の詠唱で次の場面に進む。上限はステージの中では増えない', () => {
    const r = cast(newRun(first, stage1), '岩に雷槍');
    expect(r.run.index).toBe(1);
    expect(r.run.charLimit).toBe(START_CHAR_LIMIT);
    expect(r.run.hearts).toBe(START_HEARTS + 1); // お礼のパン
  });

  it('人への攻撃は1度目は警告だけで、場面は進まない', () => {
    const r1 = cast(newRun(first, stage1), '女の子に炎');
    expect(r1.warning).toBeTruthy();
    expect(r1.run.index).toBe(0);
    const r2 = cast(r1.run, '女の子に炎');
    expect(r2.run.index).toBe(1);
    expect(r2.run.owned).toContain('regret');
  });

  it('後悔を持ったまま悪いことを重ねると禁忌がつく', () => {
    const run = play(newRun(first, stage1), ['枯れ木に炎', '炎槍', '納屋に炎']);
    expect(run.taboos).toHaveLength(1);
  });

  it('ハートが0になると疲れて故郷に帰る', () => {
    let run = newRun(first, ['bear', 'barn', 'crows']);
    run = { ...run, owned: [...run.owned, 'boost'] };
    run = cast(run, '熊に強化').run; // -2
    expect(run.hearts).toBe(START_HEARTS - 2);
    run = cast(run, '納屋に炎').run; // -1
    expect(run.phase).toBe('record');
    expect(run.result).toBe('tired');
  });

  it('ステージの終わりに宿でハートが回復し、分かれ道になる', () => {
    let run = play(newRun(first, stage1), ['岩に雷槍', '炎槍']);
    const hearts = run.hearts;
    run = cast(run, '納屋に壁', first).run;
    expect(run.phase).toBe('fork');
    expect(run.hearts).toBe(Math.min(MAX_HEARTS, hearts + INN_HEARTS));
    expect(currentScene(run).id).toBe('crossroads');
    expect(run.forkOptions).toEqual(['mountain', 'river', 'forest']);
  });

  it('分かれ道で言葉が効いた道へ進み、文字数の上限が2増える', () => {
    let run = play(newRun(first, stage1), ['岩に雷槍', '炎槍', '納屋に壁']);
    run = cast(run, '大岩に槍', first).run;
    expect(run.phase).toBe('scene');
    expect(run.stage).toBe(1);
    expect(run.region).toBe('mountain');
    expect(run.sceneIds).toEqual(expect.arrayContaining(['bear', 'wolves']));
    expect(run.charLimit).toBe(START_CHAR_LIMIT + 2);
  });

  it('どの道も開かなければ街道へ。同じ場面は二度起きない', () => {
    let run = play(newRun(first, stage1), ['岩に雷槍', '炎槍', '納屋に壁']);
    run = cast(run, '壁', first).run;
    expect(run.region).toBe('road');
    expect(new Set(run.usedScenes).size).toBe(run.usedScenes.length);
  });

  it('行った地域は次の分かれ道に出ない', () => {
    let run = play(newRun(first, stage1), ['岩に雷槍', '炎槍', '納屋に壁', '大川に氷']);
    expect(run.region).toBe('river');
    for (let i = 0; i < STAGE_LENGTH; i++) run = { ...cast({ ...run, hearts: MAX_HEARTS }, '壁', first).run };
    expect(run.phase).toBe('fork');
    expect(run.forkOptions).toEqual(['mountain', 'forest']);
  });

  it('3ステージを終えると新しい旅へ', () => {
    let run = newRun(first, stage1);
    for (let i = 0; i < 20 && run.phase !== 'record'; i++) {
      run = { ...run, hearts: MAX_HEARTS }; // 進行だけ確かめる
      run = cast(run, '壁', first).run;
    }
    expect(run.result).toBe('complete');
    expect(run.stage).toBe(STAGE_COUNT - 1);
    expect(run.usedScenes).toHaveLength(STAGE_COUNT * STAGE_LENGTH);
  });

  it('初期ワードは属性3つと形2つだけ', () => {
    expect(STARTING_WORDS).toEqual(['fire', 'ice', 'thunder', 'spear', 'wall']);
    expect(newRun(first, stage1).owned).toEqual(STARTING_WORDS);
  });

  it('旅の中で出来事の言葉とお礼の言葉が増えていく', () => {
    let run = newRun(first, stage1);
    run = cast(run, '岩に雷槍').run;
    expect(run.owned).toContain('gravel');
    expect(run.owned).toContain('heal');
    run = cast(run, '炎槍', first).run; // 女の子の加勢で小鬼を懲らしめる
    expect(run.owned).toContain('chain');
    expect(run.gainedWords).toEqual(['gravel', 'heal', 'chain']);
  });

  it('知らない言葉は唱えても何も起きない', () => {
    const r = cast(newRun(first, stage1), '岩に刃');
    expect(r.run.owned).not.toContain('blade');
    expect(r.run.log.some((l) => l.includes('「刃」はまだ知らない言葉'))).toBe(true);
  });

  it('もう持っている言葉をもらったらハート+1', () => {
    let run = newRun(first, ['bear', 'barn', 'crows']);
    run = { ...run, owned: [...run.owned, 'earth'] };
    const hearts = run.hearts;
    run = cast(run, '壁').run;
    expect(run.hearts).toBe(hearts + 1);
  });
});
