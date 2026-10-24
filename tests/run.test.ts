import { describe, expect, it } from 'vitest';
import { cast, currentScene, endingMessage, forget, handSize, INN_HEARTS, MAX_HEARTS, maxHearts, newRun, START_CHAR_LIMIT, START_HEARTS, TABOO_LIMIT, type RunState } from '../src/game/run';
import { buildStage, SCENES, STAGE_COUNT, STAGE_LENGTH } from '../src/game/scenes';
import { REGIONS } from '../src/game/scenes/regions';
import { FIZZLE, HAND_LIMIT, STARTING_WORDS } from '../src/game/words';

const first = () => 0; // 予告は候補の1つめ
const stage1 = ['rockfall', 'imp', 'barn', 'crows', 'valley'];
// 最初のステージを抜けて分かれ道に着くまでの呪文
const toFork = ['岩に雷槍', '炎槍', '納屋に壁', 'かかしに雷', '壁'];

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
    expect(ids.every((id) => REGIONS.mountain.scenes.includes(id))).toBe(true);
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
    let run = newRun(first, ['bear', 'barn', 'crows', 'fog', 'fox']);
    run = { ...run, owned: [...run.owned, 'boost'] };
    run = cast(run, '熊に強化').run; // -2
    expect(run.hearts).toBe(START_HEARTS - 2);
    run = cast(run, '納屋に炎').run; // -1
    expect(run.phase).toBe('record');
    expect(run.result).toBe('tired');
  });

  it('ステージの終わりに宿でハートが回復し、分かれ道になる', () => {
    let run = play(newRun(first, stage1), toFork.slice(0, -1));
    const hearts = run.hearts;
    run = cast(run, '壁', first).run;
    expect(run.phase).toBe('fork');
    expect(run.hearts).toBe(Math.min(MAX_HEARTS, hearts + INN_HEARTS));
    expect(currentScene(run).id).toBe('crossroads');
    expect(run.forkOptions).toEqual(['mountain', 'river', 'forest']);
  });

  it('分かれ道で言葉が効いた道へ進み、文字数の上限が2増える', () => {
    let run = play(newRun(first, stage1), toFork);
    run = cast(run, '大岩に槍', first).run;
    expect(run.phase).toBe('scene');
    expect(run.stage).toBe(1);
    expect(run.region).toBe('mountain');
    expect(run.sceneIds.every((id) => REGIONS.mountain.scenes.includes(id))).toBe(true);
    expect(run.charLimit).toBe(START_CHAR_LIMIT + 2);
  });

  it('どの道も開かなければ街道へ。同じ場面は二度起きない', () => {
    let run = play(newRun(first, stage1), toFork);
    run = cast(run, '壁', first).run;
    expect(run.region).toBe('road');
    expect(new Set(run.usedScenes).size).toBe(run.usedScenes.length);
  });

  it('行った地域は次の分かれ道に出ない', () => {
    let run = play(newRun(first, stage1), [...toFork, '大川に氷']);
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
    let run = newRun(first, ['bear', 'barn', 'crows', 'fog', 'fox']);
    run = { ...run, owned: [...run.owned, 'earth'] };
    const hearts = run.hearts;
    run = cast(run, '壁').run;
    expect(run.hearts).toBe(hearts + 1);
  });

  it('2つの言葉をいっしょに唱えると、混ざって新しい言葉が生まれる', () => {
    let run = newRun(first, stage1);
    run = cast(run, '岩に炎氷槍').run;
    expect(run.owned).toContain('steam');
    expect(run.log.some((l) => l.includes('「蒸気」が生まれた'))).toBe(true);
  });

  it('手札が上限を超えたら、忘れるまで唱えられない', () => {
    let run = newRun(first, stage1);
    run = { ...run, owned: [...run.owned, 'earth', 'wind', 'blade', 'rain', 'chain', 'boost', 'frost', 'regret'] };
    expect(handSize(run.owned)).toBe(HAND_LIMIT);
    run = cast(run, '岩に雷槍').run; // 礫と癒しが増える
    expect(run.mustForget).toBe(true);
    expect(cast(run, '炎槍').error).toBeTruthy();
    run = forget(run, 'blade');
    expect(run.mustForget).toBe(true);
    expect(forget(run, 'regret').owned).toContain('regret'); // 黒い言葉は忘れられない
    run = forget(run, 'rain');
    expect(run.mustForget).toBe(false);
    expect(handSize(run.owned)).toBe(HAND_LIMIT);
  });
});

describe('空振りの一言', () => {
  it('効かなかった言葉には、使いどころをほのめかす一言が出る', () => {
    let run = newRun(first, stage1);
    run = { ...run, owned: [...run.owned, 'ash'] };
    run = cast(run, '岩に雷槍灰').run;
    expect(run.log).toContain(FIZZLE.ash);
  });
  it('効いた言葉には出ない', () => {
    let run = newRun(first, ['slime', 'barn', 'crows', 'fog', 'fox']);
    run = { ...run, owned: [...run.owned, 'ash'] };
    run = cast(run, '灰').run;
    expect(run.log).not.toContain(FIZZLE.ash);
  });
  it('結果を変えなかった言葉は、光らせる言葉に入らない', () => {
    let run = newRun(first, stage1);
    run = { ...run, owned: [...run.owned, 'ash'] };
    const result = cast(run, '岩に雷槍灰');
    expect(result.effective).not.toContain('ash');
    expect(result.effective!.length).toBeGreaterThan(0);
    expect(result.effective!.every((id) => result.spell!.usedWordIds.includes(id))).toBe(true);
  });
  it('どちらか一方で足りる2語は、先に唱えたほうが光る', () => {
    const result = cast(newRun(first, stage1), '雷槍');
    expect(result.effective).toEqual(['thunder']);
    expect(result.run.log).toContain('（「槍」を足しても、結果は変わらなかった）');
  });
  it('一言のない言葉が効かなかったときは、結果は変わらなかったと出る', () => {
    const run = newRun(first, stage1);
    const result = cast(run, '岩に雷槍壁');
    if (!result.effective!.includes('wall')) {
      expect(result.run.log).toContain('（「壁」を足しても、結果は変わらなかった）');
    } else {
      expect(result.run.log).not.toContain('（「壁」を足しても、結果は変わらなかった）');
    }
  });
});

describe('後悔・覚悟・禁忌', () => {
  it('禁忌がつくとハートの上限が1つ減る', () => {
    const run = play(newRun(first, stage1), ['枯れ木に炎', '炎槍', '納屋に炎']);
    expect(run.taboos).toHaveLength(1);
    expect(maxHearts(run.taboos)).toBe(MAX_HEARTS - 1);
    expect(run.log.some((l) => l.includes('ハートの上限が1つ減った'))).toBe(true);
  });

  it(`禁忌が${TABOO_LIMIT}つたまると魔王になって旅が終わる`, () => {
    let run = newRun(first, ['barn', 'crows', 'valley', 'fog', 'fox']);
    run = { ...run, owned: [...run.owned, 'regret'], taboos: ['a', 'b'] };
    run = cast(run, '納屋に炎').run;
    expect(run.phase).toBe('record');
    expect(run.result).toBe('demon');
    expect(endingMessage(run)).toContain('魔王');
  });

  it('後悔は出来事の場面でも強化のように効き、そのたびにハートが1つ減る', () => {
    const base = newRun(first, ['barn', 'crows', 'valley', 'fog', 'fox']);
    const run = cast({ ...base, owned: [...base.owned, 'regret'] }, '村人に後悔').run;
    expect(cast(base, '村人に').run.records[0].summary).not.toBe('納屋の火事を消した');
    expect(run.records[0].summary).toBe('納屋の火事を消した');
    expect(run.log.some((l) => l.includes('「後悔」にすがると'))).toBe(true);
    expect(run.log.some((l) => l.includes('胸を締めつける'))).toBe(true);
  });

  it('攻撃に後悔を足しても、攻撃のまま', () => {
    const base = newRun(first, ['watermill', 'crows', 'valley', 'fog', 'fox']);
    const run = cast({ ...base, owned: [...base.owned, 'regret'], warned: true }, '粉屋に炎後悔').run;
    expect(run.taboos).toHaveLength(1);
  });

  it('後悔にすがってだれかを助けると、その場で覚悟に変わる', () => {
    const base = newRun(first, ['barn', 'crows', 'valley', 'fog', 'fox']);
    const run = cast({ ...base, owned: [...base.owned, 'regret'] }, '納屋に氷後悔').run;
    expect(run.owned).toContain('resolve');
    expect(run.owned).not.toContain('regret');
  });

  it('助けられなければ、後悔のまま', () => {
    const base = newRun(first, ['barn', 'crows', 'valley', 'fog', 'fox']);
    const run = cast({ ...base, owned: [...base.owned, 'regret'] }, '納屋に槍後悔').run;
    expect(run.owned).toContain('regret');
    expect(run.owned).not.toContain('resolve');
  });

  it('後悔を唱えずに助けても、覚悟にはならない', () => {
    const base = newRun(first, ['barn', 'crows', 'valley', 'fog', 'fox']);
    const run = cast({ ...base, owned: [...base.owned, 'regret'] }, '納屋に氷').run;
    expect(run.owned).toContain('regret');
  });

  it('覚悟は出来事でも戦闘でも力になり、ハートは減らない', () => {
    const base = newRun(first, ['barn', 'crows', 'valley', 'fog', 'fox']);
    const plain = cast(base, '納屋に氷').run;
    const withResolve = cast({ ...base, owned: [...base.owned, 'resolve'] }, '納屋に氷覚悟').run;
    expect(withResolve.hearts).toBe(plain.hearts);
    expect(handSize([...STARTING_WORDS, 'resolve'])).toBe(STARTING_WORDS.length);
  });
});
