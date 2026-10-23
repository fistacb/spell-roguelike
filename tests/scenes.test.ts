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

describe('地域の言葉と混ざる言葉', () => {
  it('眠りは傷つけずにかけると敵が眠り、静けさが手に入る', () => {
    const o = play('slime', 'スライムに眠り', { intent: 0 });
    expect(o.hearts).toBe(0);
    expect(o.summary).toBe('スライムを眠らせて通り抜けた');
    expect(o.gainWords).toContain('quiet');
  });
  it('突っこんでくる敵は勢いづいていて眠らない', () => {
    expect(play('slime', 'スライムに眠り', { intent: 1 }).summary).not.toBe('スライムを眠らせて通り抜けた');
    expect(play('wolves', '狼に眠り', { intent: 1 }).summary).not.toBe('狼の群れを眠らせて通り抜けた');
  });
  it('攻撃といっしょだと眠りは効かない', () => {
    expect(play('wolves', '狼に眠り槍', { intent: 1 }).summary).not.toBe('狼の群れを眠らせて通り抜けた');
  });
  it('響きは力が倍になる', () => {
    expect(play('imp', '響き炎槍').summary).toBe('小鬼を懲らしめた');
  });
  it('響きは眠る熊を起こしてしまう', () => {
    expect(play('bear', '壁に響き').hearts).toBeLessThan(0);
  });
  it('流れは水の中の敵を押し流す', () => {
    expect(play('wolves', '狼に流れ', { intent: 1 }).summary).toBe('狼の群れを追い払った');
    expect(play('slime', 'スライムに流れ').reward).toBe('blade');
  });
  it('引き寄せは離れた敵の飛び道具を封じるが、突っこんでくる敵には逆効果', () => {
    expect(play('imp', '小鬼に引き寄せ', { intent: 0 }).hearts).toBe(0);
    expect(play('imp', '小鬼に引き寄せ', { intent: 1 }).hearts).toBe(-3);
  });
  it('引き寄せで女の子を助けられる', () => {
    expect(play('rockfall', '女の子に引き寄せ').summary).toBe('女の子を引き寄せて助けた');
  });
  it('礫は色をまとった相手にも半減されない', () => {
    expect(play('crows', '礫', { intent: 1 }).summary).toBe('カラスの群れを追い払った');
  });
  it('霜で転んだ敵は倒しやすい', () => {
    expect(play('golem', '霜炎槍', { intent: 0 }).summary).toBe('ゴーレムを崩した');
    expect(play('golem', '炎槍', { intent: 0 }).summary).toBe('ゴーレムから逃げ出した');
  });
  it('泥は火事を消し、敵を弱らせる', () => {
    expect(play('barn', '納屋に泥').summary).toBe('納屋の火事を消した');
    expect(play('golem', '泥', { intent: 1 }).summary).toBe('ゴーレムを崩した');
  });
  it('火事を消すと灰が手に入る', () => {
    expect(play('barn', '納屋に氷').gainWords).toContain('ash');
  });
  it('蒸気は煙のように反撃をかわす', () => {
    expect(play('imp', '蒸気', { intent: 1 }).hearts).toBe(0);
  });
  it('嵐は群れをまとめて吹き飛ばす', () => {
    expect(play('wolves', '嵐', { intent: 0 }).summary).toBe('狼の群れを追い払った');
    expect(play('crows', '嵐', { intent: 0 }).summary).toBe('カラスの群れを追い払った');
  });
  it('風はカラスを飛べなくする', () => {
    expect(play('crows', '風').summary).toBe('向かい風でカラスを追い払った');
  });
});

describe('新しい場面', () => {
  it('山びこの谷：攻撃の音で雪崩、静かなら抜けて響きが手に入る', () => {
    expect(play('valley', '炎槍').hearts).toBe(-2);
    expect(play('valley', '壁').reward).toBe('echo');
    expect(play('valley', '静けさ炎槍').reward).toBe('echo');
    expect(play('valley', '雪に炎').reward).toBe('echo');
  });
  it('岩山のゴーレム：泉の水で崩れる', () => {
    const o = play('golem', '泉に流れ');
    expect(o.summary).toBe('ゴーレムを泉の水で崩した');
    expect(o.gainWords).toContain('gravel');
  });
  it('増水した川：子どもを助けると流れが手に入る', () => {
    expect(play('flood', '子どもに引き寄せ').reward).toBe('flow');
    expect(play('flood', '濁流に氷').reward).toBe('flow');
    expect(play('flood', '子どもに鎖').reward).toBe('flow');
    expect(play('flood', '濁流に炎').hearts).toBe(-1);
  });
  it('カエルの合唱：水の中にいるうちに池に雷', () => {
    expect(play('frogs', '池に雷', { intent: 0 }).summary).toBe('カエルの群れを追い払った');
    expect(play('frogs', '池に氷', { intent: 0 }).hearts).toBe(0);
  });
  it('眠り茸の広場：妖精を助けると眠りが手に入る', () => {
    expect(play('mushroom', '茸に風').reward).toBe('sleep');
    expect(play('mushroom', '檻に引き寄せ').reward).toBe('sleep');
    expect(play('mushroom', '茸に炎').hearts).toBe(-1);
    const o = play('mushroom', '密猟者に炎槍');
    expect(o.gainRegret).toBe(true);
  });
  it('迷子の子ぎつね：助けるとハート+1、母ぎつねを攻撃すると後悔', () => {
    expect(play('fox', '子ぎつねに癒し').hearts).toBe(1);
    expect(play('fox', '穴に土壁').hearts).toBe(1);
    expect(play('fox', '母ぎつねに炎').gainRegret).toBe(true);
  });
  it('盗賊の待ち伏せ：人を傷つけると後悔、鎖や煙なら傷つけずに済む', () => {
    expect(play('bandits', '盗賊に炎雨').gainRegret).toBe(true);
    expect(play('bandits', '煙').gainRegret).toBe(false);
    expect(play('bandits', '荷車に炎').hearts).toBe(0);
    const r = SCENES.bandits.resolve(parseSpell('盗賊に炎槍', owned), { flags: {}, warned: false, intent: SCENES.bandits.intents![0], rng: () => 0.99 });
    expect(r.kind).toBe('warning');
  });
  it('旅の行商人：ロバを助けると引き寄せ、何もできないとハートで買う', () => {
    expect(play('merchant', 'ロバに癒し').reward).toBe('pull');
    const o = play('merchant', 'あいう');
    expect(o.hearts).toBe(-1);
    expect(o.reward).toBe('pull');
  });
});

describe('灰', () => {
  it('攻撃せずにまくと、どの戦闘でも戦わずに抜けられる。言葉はもらえない', () => {
    for (const id of ['imp', 'slime', 'golem', 'wolves']) {
      const o = play(id, '灰', { intent: 0 });
      expect(o.summary).toContain('灰にまぎれて');
      expect(o.hearts).toBe(0);
      expect(o.reward).toBeNull();
    }
  });
  it('風の攻撃や水の中の敵には効かない', () => {
    expect(play('crows', '灰', { intent: 0 }).summary).not.toContain('灰にまぎれて');
    expect(play('frogs', '灰', { intent: 0 }).summary).not.toContain('灰にまぎれて');
  });
  it('攻撃といっしょだと吹き散らされる', () => {
    const o = play('slime', '灰炎槍', { intent: 0 });
    expect(o.summary).not.toContain('灰にまぎれて');
    expect(o.log).toContain('灰が舞い上がったが、呪文の勢いで吹き散らされてしまった。');
  });
});

describe('静けさ', () => {
  it('森・川・街道でも使い道がある', () => {
    expect(play('fox', '母ぎつねに静けさ').summary).toBe('母ぎつねを落ち着かせて子ぎつねを助けた');
    expect(play('frogs', '静けさ', { intent: 1 }).summary).toBe('カエルの合唱を静めて通り抜けた');
    expect(play('bandits', '静けさ', { intent: 0 }).summary).toBe('盗賊たちをまいて逃げ切った');
  });
});

describe('増えた場面', () => {
  it('凍った水車：ほどよい炎や水路を割ると流れ、強い炎は焦がす', () => {
    expect(play('watermill', '炎').reward).toBe('flow');
    expect(play('watermill', '水路に槍').reward).toBe('flow');
    expect(play('watermill', '炎強化').reward).toBeNull();
  });
  it('井戸の子ヤギ：氷の足場や縄で引き寄せ、雷はおびえさせる', () => {
    expect(play('goatwell', '氷').reward).toBe('pull');
    expect(play('goatwell', '縄に鎖').reward).toBe('pull');
    const o = play('goatwell', '雷');
    expect(o.hearts).toBe(-1);
    expect(o.reward).toBeNull();
  });
  it('夜の見張り：光で追い払い、鶏小屋を燃やすと後悔', () => {
    expect(play('nightwatch', '雷').summary).toBe('小鬼たちを光で追い払った');
    expect(play('nightwatch', '松明に炎').hearts).toBe(1);
    expect(play('nightwatch', '鶏小屋に炎').gainRegret).toBe(true);
    expect(play('nightwatch', '鶏小屋に壁').summary).toBe('壁で鶏小屋を守った');
  });
  it('ぬかるみの馬車：凍らせるか土で埋めると土が手に入り、泥はゆるむ', () => {
    expect(play('mudcart', '氷').reward).toBe('earth');
    expect(play('mudcart', '土').reward).toBe('earth');
    expect(play('mudcart', '泥').reward).toBeNull();
    expect(play('mudcart', '馬に槍').gainRegret).toBe(true);
  });
  it('関所の番兵：癒しで眠りが手に入り、こっそり抜けることもできる', () => {
    expect(play('checkpoint', '番兵に癒し').reward).toBe('sleep');
    expect(play('checkpoint', '静けさ').hearts).toBe(0);
    expect(play('checkpoint', '灯りに風').hearts).toBe(0);
    expect(play('checkpoint', '何もない').hearts).toBe(-1);
    expect(play('checkpoint', '番兵に槍').hearts).toBe(-2);
  });
  it('雨宿りの廃寺：塔に雷で響きが手に入り、屋根や壁でも休める', () => {
    const o = play('temple', '塔に雷');
    expect(o.reward).toBe('echo');
    expect(o.hearts).toBe(1);
    expect(play('temple', '壁').hearts).toBe(1);
    expect(play('temple', '屋根に土').hearts).toBe(1);
    expect(play('temple', '槍').hearts).toBe(-1);
  });
  it('旅芸人の一座：舞台に火の粉や見物人に響きで盛り上がる', () => {
    expect(play('performers', '火の粉').reward).toBe('echo');
    expect(play('performers', '見物人に響き').hearts).toBe(1);
    expect(play('performers', '炎').reward).toBeNull();
    expect(play('performers', '芸人に槍').gainRegret).toBe(true);
  });
  it('森の祠：静けさや灯明で眠りが手に入り、番人を攻撃すると祟られる', () => {
    expect(play('shrine', '静けさ').reward).toBe('sleep');
    expect(play('shrine', '炎').reward).toBe('sleep');
    expect(play('shrine', '祠に炎槍').hearts).toBe(-1);
    const o = play('shrine', '槍');
    expect(o.hearts).toBe(-2);
    expect(o.gainRegret).toBe(true);
    expect(play('shrine', '番人に響き').gainRegret).toBe(false);
  });
  it('蜘蛛の巣の小道：切るか吹き飛ばすと刃が手に入り、燃やすと燃え移る', () => {
    expect(play('spiderweb', '刃').reward).toBe('blade');
    expect(play('spiderweb', '風').reward).toBe('blade');
    const o = play('spiderweb', '炎');
    expect(o.hearts).toBe(-1);
    expect(o.reward).toBeNull();
    expect(play('spiderweb', '炎雨').reward).toBe('blade');
  });
  it('迷いの灯り：鬼火を消すか道しるべを照らすと風が手に入る', () => {
    expect(play('wisp', '雨').reward).toBe('wind');
    expect(play('wisp', '道しるべに炎').reward).toBe('wind');
    expect(play('wisp', '炎').hearts).toBe(-1);
  });
  it('吹雪の山小屋：暖炉に火で癒しが手に入り、戸口をふさぐと凍えずに済む', () => {
    expect(play('blizzard', '炎').reward).toBe('heal');
    expect(play('blizzard', '壁').hearts).toBe(0);
    expect(play('blizzard', '吹雪に風').hearts).toBe(-1);
  });
  it('崖の旅人：鎖や足場で助けると鎖が手に入り、間に合わないと後悔', () => {
    expect(play('cliff', '鎖').reward).toBe('chain');
    expect(play('cliff', '壁').reward).toBe('chain');
    expect(play('cliff', '木の根に氷').reward).toBe('chain');
    expect(play('cliff', '炎').gainRegret).toBe(true);
  });
  it('川の主：水の中なら川に雷、乗り上げてきたら岸に壁', () => {
    expect(play('catfish', '川に雷', { intent: 0 }).summary).toBe('川の主を静めた');
    expect(play('catfish', '岸に壁', { intent: 1 }).hearts).toBe(0);
    expect(play('catfish', '鎖', { intent: 1 }).hearts).toBeLessThan(0);
  });
  it('壊れた水門：ふさぐか流れを戻すと土が手に入る', () => {
    expect(play('sluice', '壁').reward).toBe('earth');
    expect(play('sluice', '流れ').reward).toBe('earth');
    expect(play('sluice', '槍').reward).toBeNull();
    expect(play('sluice', '農夫に槍').gainRegret).toBe(true);
  });
});
