import { describe, expect, it } from 'vitest';
import { parseSpell } from '../src/game/parse';
import type { Flags, Outcome } from '../src/game/scene';
import { SCENES } from '../src/game/scenes';
import { makeCrossroads } from '../src/game/scenes/crossroads';
import { WORDS } from '../src/game/words';

// 場面のしかけを確かめるため、すべての言葉を持っていることにする
const owned = new Set(WORDS.filter((w) => w.kind !== 'target').map((w) => w.id));

function play(sceneId: string, input: string, opts: { flags?: Flags; intent?: number; warned?: boolean; rng?: () => number } = {}): Outcome {
  const scene = SCENES[sceneId];
  const r = scene.resolve(parseSpell(input, owned), {
    flags: opts.flags ?? {},
    warned: opts.warned ?? true,
    intent: scene.intents ? scene.intents[opts.intent ?? 0] : null,
    rng: opts.rng ?? (() => 0.99),
  });
  if (r.kind !== 'outcome') throw new Error('warning');
  return r.outcome;
}

describe('女の子と落石', () => {
  it('岩を砕くと加勢、お礼でハート+1', () => {
    const o = play('rockfall', '岩に雷槍');
    expect(o.flags.girl).toBe('grateful');
    expect(o.hearts).toBe(1);
  });
  it('対象なしの攻撃は落ちてくる岩に向かう', () => {
    expect(play('rockfall', '土槍').flags.girl).toBe('grateful');
  });
  it('壁は岩を防ぎ、壁が残る', () => {
    expect(play('rockfall', '氷壁').flags).toMatchObject({ girl: 'walled', wallStands: true });
  });
  it('強化で自分で砕く、属性も混ぜると暴走', () => {
    expect(play('rockfall', '女の子に強化').flags.girl).toBe('powered');
    expect(play('rockfall', '女の子に炎強化').flags.girl).toBe('overcharged');
  });
  it('枯れ木に炎は煙が出るが女の子は救えない', () => {
    const o = play('rockfall', '枯れ木に炎');
    expect(o.flags.treeBurned).toBe(true);
    expect(o.gainRegret).toBe(true);
  });
  it('女の子への攻撃は初回に警告', () => {
    const r = SCENES.rockfall.resolve(parseSpell('女の子に炎槍', owned), { flags: {}, warned: false, intent: null, rng: () => 0 });
    expect(r.kind).toBe('warning');
    const o = play('rockfall', '女の子に炎槍');
    expect(o.hearts).toBe(-1);
    expect(o.gainRegret).toBe(true);
  });
});

describe('いたずら小鬼（1回の詠唱で決着）', () => {
  it('違う色の攻撃で倒せれば無傷', () => {
    const o = play('imp', '炎槍刃'); // 投石＝土をまとう。6+3+3=12 ≥ 8
    expect(o.hearts).toBe(0);
    expect(o.summary).toBe('小鬼を懲らしめた');
  });
  it('倒せないと反撃を受ける。同じ色の壁なら無傷', () => {
    expect(play('imp', '炎槍').hearts).toBe(-1); // 6 < 8
    expect(play('imp', '炎槍土壁').hearts).toBe(0);
  });
  it('小川を渡る小鬼には雷が2倍', () => {
    const o = play('imp', '雷槍', { intent: 1 }); // 雷をまとう→半減、感電で2倍
    expect(o.summary).toBe('小鬼に逃げられた');
    expect(play('imp', '雷槍刃', { intent: 1 }).summary).toBe('小鬼を懲らしめた');
  });
  it('凍った小川では体当たりの小鬼が転ぶ', () => {
    expect(play('imp', '癒し', { intent: 1, flags: { streamFrozen: true } }).hearts).toBe(1);
  });
  it('加勢した女の子のぶんも合わせて倒せる', () => {
    expect(play('imp', '炎槍', { flags: { girl: 'grateful' } }).summary).toBe('小鬼を懲らしめた');
  });
  it('煙でしぶとさが下がる', () => {
    expect(play('imp', '炎槍', { flags: { treeBurned: true } }).summary).toBe('小鬼を懲らしめた');
  });
  it('残った壁が反撃を1回防ぐ', () => {
    const o = play('imp', '炎', { flags: { wallStands: true } });
    expect(o.hearts).toBe(0);
    expect(o.flags.wallStands).toBe(false);
  });
  it('鎖だけでは振りほどかれる', () => {
    expect(play('imp', '鎖').summary).not.toBe('小鬼を懲らしめた');
  });
  it('弱らせれば鎖で捕まえられる', () => {
    // 雨4＋鎖2＝6で倒しきれないが、しぶとさ8の半分を超えるので捕まえる
    expect(play('imp', '炎雨').summary).not.toBe('小鬼を懲らしめた');
    expect(play('imp', '炎雨鎖').summary).toBe('小鬼を懲らしめた');
  });
  it('後悔は威力2倍だがハート-1', () => {
    const o = play('imp', '後悔炎槍');
    expect(o.summary).toBe('小鬼を懲らしめた');
    expect(o.hearts).toBe(-1);
  });
});

describe('吊り橋の狼', () => {
  it('雨は群れによく効く', () => {
    expect(play('wolves', '炎雨').summary).toBe('狼の群れを追い払った');
    expect(play('wolves', '炎槍').summary).toBe('狼の群れから逃げ切った');
  });
  it('橋を燃やすと戦わずに済むが遠回りでハート-1', () => {
    const o = play('wolves', '橋に炎');
    expect(o.hearts).toBe(-1);
    expect(o.summary).toBe('吊り橋を落として逃げた');
  });
  it('谷川を渡る群れに雷', () => {
    expect(play('wolves', '谷川に雷', { intent: 1 }).summary).toBe('狼の群れを追い払った');
  });
});

describe('燃える納屋', () => {
  it('氷で消すとハート+1', () => {
    expect(play('barn', '納屋に氷').hearts).toBe(1);
    expect(play('barn', '氷雨').hearts).toBe(1);
  });
  it('井戸や村人を強化しても消せる', () => {
    expect(play('barn', '井戸に強化').summary).toBe('納屋の火事を消した');
    expect(play('barn', '村人に強化').summary).toBe('納屋の火事を消した');
  });
  it('炎はひどくして後悔', () => {
    const o = play('barn', '納屋に炎');
    expect(o.gainRegret).toBe(true);
    expect(o.hearts).toBe(-1);
  });
});

describe('道をふさぐ熊', () => {
  it('蜂の巣を落とすと気がそれる', () => {
    expect(play('bear', '巣に土槍').hearts).toBe(0);
  });
  it('癒しでぐっすり眠らせる、鎖で縛る', () => {
    expect(play('bear', '熊に癒し').hearts).toBe(0);
    expect(play('bear', '熊に鎖').hearts).toBe(0);
  });
  it('起こして倒せないと爪でハート-2', () => {
    expect(play('bear', '熊に炎槍').hearts).toBe(-2);
  });
  it('何もしないと見つかってハート-1', () => {
    expect(play('bear', 'あいう').hearts).toBe(-1);
  });
});

describe('沼のスライム', () => {
  it('沼に氷でスライムごと凍る', () => {
    expect(play('slime', '沼に氷').summary).toBe('スライムを沼ごと凍らせた');
  });
  it('槍は手ごたえがなく、雷はよく効く', () => {
    expect(play('slime', '炎槍').summary).toBe('スライムに泥だらけにされた');
    expect(play('slime', '雷雨').summary).toBe('スライムを追い払った');
  });
  it('枯れ草を燃やすとしぼむ', () => {
    expect(play('slime', '草に炎').summary).toBe('スライムに泥だらけにされた');
    expect(play('slime', '炎雨').summary).toBe('スライムを追い払った');
  });
});

describe('出来事ワードとお礼の言葉', () => {
  it('木を燃やすと煙、川を凍らせると霜、岩を砕くと礫', () => {
    expect(play('rockfall', '枯れ木に炎').gainWords).toContain('smoke');
    expect(play('rockfall', '小川に氷').gainWords).toContain('frost');
    expect(play('rockfall', '岩に槍').gainWords).toContain('gravel');
  });
  it('うまく切り抜けるとお礼の言葉がもらえる', () => {
    expect(play('rockfall', '岩に槍').reward).toBe('heal');
    expect(play('rockfall', '壁').reward).toBe('heal');
    expect(play('imp', '炎槍', { flags: { girl: 'grateful' } }).reward).toBe('chain');
    expect(play('barn', '納屋に氷').reward).toBe('boost');
    expect(play('wolves', '炎雨').reward).toBe('rain');
    expect(play('bear', '熊に癒し').reward).toBe('earth');
    expect(play('slime', '沼に氷').reward).toBe('blade');
  });
  it('失敗するとお礼の言葉はもらえない', () => {
    expect(play('rockfall', '枯れ木に炎').reward).toBeNull();
    expect(play('wolves', '炎槍').reward).toBeNull();
  });
  it('煙は反撃をかわす', () => {
    expect(play('imp', '煙', { intent: 1 }).hearts).toBe(0);
    expect(play('imp', '炎', { intent: 1 }).hearts).toBe(-2);
  });
  it('霜は地面を走ってくる攻撃だけ止める', () => {
    expect(play('slime', '霜', { intent: 1 }).hearts).toBe(0); // のしかかり
    expect(play('slime', '霜', { intent: 0 }).hearts).toBe(-1); // 泥はね
  });
  it('礫は土の雨として群れによく効く', () => {
    const spell = parseSpell('礫', owned);
    expect(spell.elements).toEqual(['earth']);
    expect(spell.shapes).toEqual(['rain']);
    expect(play('wolves', '礫', { intent: 0 }).summary).toBe('狼の群れを追い払った');
  });
  it('煙にまぎれて眠る熊の横を通れる', () => {
    expect(play('bear', '煙').hearts).toBe(0);
  });
});

describe('畑のカラス', () => {
  it('雨は群れによく効き、お礼でハート+1', () => {
    expect(play('crows', '炎雨').summary).toBe('カラスの群れを追い払った');
    expect(play('crows', '炎雨').hearts).toBe(1);
  });
  it('かかしを強化するか雷を落とすと追い払える', () => {
    expect(play('crows', 'かかしに強化').summary).toBe('かかしを動かしてカラスを追い払った');
    expect(play('crows', 'かかしに雷').hearts).toBe(1);
  });
  it('麦畑を燃やすと後悔と煙', () => {
    const o = play('crows', '畑に炎');
    expect(o.gainRegret).toBe(true);
    expect(o.gainWords).toContain('smoke');
  });
});

describe('大川の渡し場', () => {
  it('凍らせると歩いて渡れて霜が手に入る', () => {
    const o = play('ferry', '大川に氷');
    expect(o.hearts).toBe(0);
    expect(o.gainWords).toContain('frost');
  });
  it('船頭を癒すと舟に乗せてもらえて雨の言葉', () => {
    const o = play('ferry', '船頭に癒し');
    expect(o.hearts).toBe(1);
    expect(o.reward).toBe('rain');
  });
  it('鎖で舟をたぐり寄せる、土の壁で橋をかける', () => {
    expect(play('ferry', '舟に鎖').hearts).toBe(0);
    expect(play('ferry', '大川に土壁').hearts).toBe(0);
  });
  it('何もできないと泳いでハート-1', () => {
    expect(play('ferry', '大川に槍').hearts).toBe(-1);
  });
});

describe('霧の森', () => {
  it('ランタンを灯すと抜けられて風の言葉', () => {
    const o = play('fog', 'ランタンに炎');
    expect(o.hearts).toBe(0);
    expect(o.reward).toBe('wind');
  });
  it('風で霧を払う、フクロウを癒す', () => {
    expect(play('fog', '霧に風').reward).toBe('wind');
    expect(play('fog', 'フクロウに癒し').reward).toBe('wind');
  });
  it('迷うとハート-1', () => {
    expect(play('fog', '霧に氷').hearts).toBe(-1);
  });
});

describe('分かれ道', () => {
  const cross = makeCrossroads(['mountain', 'river', 'forest']);
  const route = (input: string) => {
    const r = cross.resolve(parseSpell(input, owned), { flags: {}, warned: false, intent: null, rng: () => 0 });
    if (r.kind !== 'outcome') throw new Error('warning');
    return r.outcome.route;
  };
  it('ふさいでいる物に効く言葉で道が開く', () => {
    expect(route('大岩に槍')).toBe('mountain');
    expect(route('大岩に礫')).toBe('mountain');
    expect(route('大川に霜')).toBe('river');
    expect(route('霧に風')).toBe('forest');
  });
  it('効かなければ街道', () => {
    expect(route('大岩に氷')).toBe('road');
    expect(route('壁')).toBe('road');
  });
  it('並んでいない道は開かない', () => {
    const r = makeCrossroads(['forest']).resolve(parseSpell('大岩に槍', owned), { flags: {}, warned: false, intent: null, rng: () => 0 });
    expect(r.kind === 'outcome' && r.outcome.route).toBe('road');
  });
});
