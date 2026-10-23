// 辞書。ゲームに存在するワードの一覧（所持しているかどうかは別に管理する）

export type Element = 'fire' | 'ice' | 'thunder' | 'earth' | 'wind';
export type Shape = 'spear' | 'blade' | 'rain' | 'wall' | 'chain';
// 物や相手の状態を変える言葉
export type Support = 'boost' | 'heal' | 'sleep' | 'echo' | 'flow' | 'pull';
// 出来事から生まれる、攻撃ではない小技
export type Trick = 'smoke' | 'frost' | 'mud' | 'ash' | 'quiet';
export type TargetId =
  | 'rock' | 'girl' | 'tree' | 'stream' | 'imp' | 'self' | 'enemy'
  | 'wolf' | 'bridge' | 'barn' | 'villager' | 'well'
  | 'bear' | 'hive' | 'slime' | 'swamp' | 'grass'
  | 'crow' | 'scarecrow' | 'field' | 'river' | 'boat' | 'boatman' | 'fog' | 'lantern' | 'owl' | 'boulder'
  | 'snow' | 'golem' | 'spring' | 'child' | 'oldbridge' | 'torrent' | 'frog' | 'pond' | 'lily'
  | 'mushroom' | 'cage' | 'poacher' | 'fairy' | 'kit' | 'pit' | 'vixen' | 'bandit' | 'cart'
  | 'merchant' | 'donkey' | 'pack';

// hint：カードをタップしたときの、効果をはっきり言わない一言
// flash：混ざった言葉などが効いたときの演出
export type Word =
  | { id: string; text: string; kind: 'element'; element: Element; hint: string }
  | { id: string; text: string; kind: 'shape'; shape: Shape; hint: string }
  | { id: string; text: string; kind: 'support'; support: Support; hint: string }
  | {
    id: string; text: string; kind: 'compound'; hint: string; flash: string;
    element?: Element; shapes: Shape[]; tricks?: Trick[];
    // 色をまとった相手にも半減されない
    pure?: boolean;
  }
  | { id: string; text: string; kind: 'trick'; trick: Trick; hint: string }
  | { id: string; text: string; kind: 'black'; black: 'regret'; hint: string }
  | { id: string; text: string; kind: 'target'; target: TargetId; aliases?: string[] };

export const WORDS: Word[] = [
  { id: 'fire', text: '炎', kind: 'element', element: 'fire', hint: '熱い。乾いたものほどよく燃える。' },
  { id: 'ice', text: '氷', kind: 'element', element: 'ice', hint: '冷たい。水があるところで本当の力が出る。' },
  { id: 'thunder', text: '雷', kind: 'element', element: 'thunder', hint: 'ぴりぴりする。濡れたものの中を走りたがっている。' },
  { id: 'earth', text: '土', kind: 'element', element: 'earth', hint: '重くて、どっしりしている。何かをふさぐのが得意そう。' },
  { id: 'wind', text: '風', kind: 'element', element: 'wind', hint: 'どこかへ吹き抜けていく音。もやもやしたものが嫌いらしい。' },
  { id: 'spear', text: '槍', kind: 'shape', shape: 'spear', hint: 'まっすぐ一点を貫く。' },
  { id: 'blade', text: '刃', kind: 'shape', shape: 'blade', hint: '二度、すばやく切りつける。ロープや草なら簡単に切れそう。' },
  { id: 'rain', text: '雨', kind: 'shape', shape: 'rain', hint: 'ぱらぱらと広く降る。たくさんいる相手に。' },
  { id: 'wall', text: '壁', kind: 'shape', shape: 'wall', hint: '立ちふさがって、守る。同じ色の攻撃にはとくに強い。' },
  { id: 'chain', text: '鎖', kind: 'shape', shape: 'chain', hint: '縛る、つなぐ。弱ったものほど逃げられない。' },
  { id: 'boost', text: '強化', kind: 'support', support: 'boost', hint: 'かけたものが、少しだけ大きく、強くなる。かける相手は選んで。' },
  { id: 'heal', text: '癒し', kind: 'support', support: 'heal', hint: 'やさしい光。傷ついたものなら、なんでも。' },
  { id: 'sleep', text: '眠り', kind: 'support', support: 'sleep', hint: 'まぶたが重くなるような響き。' },
  { id: 'echo', text: '響き', kind: 'support', support: 'echo', hint: '声が山に跳ね返ってくる。大きな音は、眠っているものに届く。' },
  { id: 'flow', text: '流れ', kind: 'support', support: 'flow', hint: '水は低い方へ、どこまでも。' },
  { id: 'pull', text: '引き寄せ', kind: 'support', support: 'pull', hint: '遠くのものが、手の届くところへ。' },
  { id: 'regret', text: '後悔', kind: 'black', black: 'regret', hint: '胸の奥で、黒く重たく沈んでいる。すがれば力になるが、痛む。' },
  // 出来事ワード：起こした出来事がそのまま言葉になる
  { id: 'smoke', text: '煙', kind: 'trick', trick: 'smoke', hint: 'もくもくと、だれの目もごまかせそうな匂い。' },
  { id: 'frost', text: '霜', kind: 'trick', trick: 'frost', hint: '足もとがひやりとする。走ってくるものは滑りそう。' },
  { id: 'ash', text: '灰', kind: 'trick', trick: 'ash', hint: '燃え尽きたあとの、さらさらした匂い。火も足跡も覆ってしまう。' },
  { id: 'quiet', text: '静けさ', kind: 'trick', trick: 'quiet', hint: 'しんとしている。この言葉の中では、どんな音も小さくなる。' },
  {
    id: 'gravel', text: '礫', kind: 'compound', element: 'earth', shapes: ['rain'], pure: true,
    hint: '手のひらで小石がざらざら鳴っている。ばらまけば、あちこちに当たりそう。',
    flash: '小石が雨あられと降り注いだ！',
  },
  // 混ざって生まれる言葉：特定の言葉をいっしょに唱えると生まれる
  {
    id: 'steam', text: '蒸気', kind: 'compound', shapes: ['rain'], tricks: ['smoke'], pure: true,
    hint: '熱い霧。燃えも凍りもしないが、あたり一面に届く。',
    flash: '熱い蒸気があたり一面に噴き出した！',
  },
  {
    id: 'mud', text: '泥', kind: 'compound', element: 'earth', shapes: [], tricks: ['mud'],
    hint: '重く、まとわりつく。動きの速いものほど嫌がりそう。',
    flash: '泥がべったりとまとわりついた！',
  },
  {
    id: 'storm', text: '嵐', kind: 'compound', element: 'thunder', shapes: ['rain', 'rain'],
    hint: 'ごうごうと荒れ狂う。まわりのものまで巻きこみそう。',
    flash: '稲妻まじりの嵐が吹き荒れた！',
  },
  {
    id: 'sparks', text: '火の粉', kind: 'compound', element: 'fire', shapes: ['rain'],
    hint: '小さな火が、風に乗ってどこまでも広がっていく。',
    flash: '火の粉が風に乗って広がった！',
  },
  { id: 'rock', text: '岩', kind: 'target', target: 'rock' },
  { id: 'girl', text: '女の子', kind: 'target', target: 'girl', aliases: ['少女'] },
  { id: 'tree', text: '木', kind: 'target', target: 'tree', aliases: ['枯れ木', '枯木', '大木'] },
  { id: 'stream', text: '川', kind: 'target', target: 'stream', aliases: ['小川', '谷川'] },
  { id: 'imp', text: '小鬼', kind: 'target', target: 'imp', aliases: ['鬼'] },
  { id: 'self', text: '自分', kind: 'target', target: 'self', aliases: ['私', '僕'] },
  // その場面の敵を指す
  { id: 'enemy', text: '敵', kind: 'target', target: 'enemy', aliases: ['あいつ', 'やつ'] },
  { id: 'wolf', text: '狼', kind: 'target', target: 'wolf', aliases: ['群れ'] },
  { id: 'bridge', text: '橋', kind: 'target', target: 'bridge', aliases: ['吊り橋'] },
  { id: 'barn', text: '納屋', kind: 'target', target: 'barn', aliases: ['小屋', '火'] },
  { id: 'villager', text: '村人', kind: 'target', target: 'villager', aliases: ['おじさん'] },
  { id: 'well', text: '井戸', kind: 'target', target: 'well' },
  { id: 'bear', text: '熊', kind: 'target', target: 'bear', aliases: ['クマ', 'くま'] },
  { id: 'hive', text: '蜂の巣', kind: 'target', target: 'hive', aliases: ['巣', '蜜'] },
  { id: 'slime', text: 'スライム', kind: 'target', target: 'slime' },
  { id: 'swamp', text: '沼', kind: 'target', target: 'swamp' },
  { id: 'grass', text: '草', kind: 'target', target: 'grass', aliases: ['枯れ草'] },
  { id: 'crow', text: 'カラス', kind: 'target', target: 'crow', aliases: ['烏', 'からす'] },
  { id: 'scarecrow', text: 'かかし', kind: 'target', target: 'scarecrow', aliases: ['案山子', 'カカシ'] },
  { id: 'field', text: '麦畑', kind: 'target', target: 'field', aliases: ['畑', '麦'] },
  { id: 'river', text: '大川', kind: 'target', target: 'river' },
  { id: 'boat', text: '渡し舟', kind: 'target', target: 'boat', aliases: ['舟', '船'] },
  { id: 'boatman', text: '船頭', kind: 'target', target: 'boatman', aliases: ['船頭さん'] },
  { id: 'fog', text: '霧', kind: 'target', target: 'fog' },
  { id: 'lantern', text: 'ランタン', kind: 'target', target: 'lantern', aliases: ['灯り'] },
  { id: 'owl', text: 'フクロウ', kind: 'target', target: 'owl', aliases: ['ふくろう', '梟'] },
  { id: 'boulder', text: '大岩', kind: 'target', target: 'boulder' },
  { id: 'snow', text: '雪', kind: 'target', target: 'snow', aliases: ['雪庇', '積もった雪'] },
  { id: 'golem', text: 'ゴーレム', kind: 'target', target: 'golem', aliases: ['岩人形'] },
  { id: 'spring', text: '泉', kind: 'target', target: 'spring', aliases: ['湧き水'] },
  { id: 'child', text: '子ども', kind: 'target', target: 'child', aliases: ['男の子', '子供'] },
  { id: 'oldbridge', text: '古い橋', kind: 'target', target: 'oldbridge', aliases: ['古橋'] },
  { id: 'torrent', text: '濁流', kind: 'target', target: 'torrent' },
  { id: 'frog', text: 'カエル', kind: 'target', target: 'frog', aliases: ['蛙', 'かえる'] },
  { id: 'pond', text: '池', kind: 'target', target: 'pond' },
  { id: 'lily', text: '蓮の葉', kind: 'target', target: 'lily', aliases: ['蓮'] },
  { id: 'mushroom', text: '眠り茸', kind: 'target', target: 'mushroom', aliases: ['茸', 'きのこ', 'キノコ'] },
  { id: 'cage', text: '檻', kind: 'target', target: 'cage', aliases: ['鳥かご'] },
  { id: 'poacher', text: '密猟者', kind: 'target', target: 'poacher', aliases: ['男'] },
  { id: 'fairy', text: '妖精', kind: 'target', target: 'fairy' },
  { id: 'kit', text: '子ぎつね', kind: 'target', target: 'kit', aliases: ['子狐', '子ギツネ'] },
  { id: 'pit', text: '穴', kind: 'target', target: 'pit', aliases: ['落とし穴'] },
  { id: 'vixen', text: '母ぎつね', kind: 'target', target: 'vixen', aliases: ['母狐', 'きつね', '狐'] },
  { id: 'bandit', text: '盗賊', kind: 'target', target: 'bandit', aliases: ['盗賊たち'] },
  { id: 'cart', text: '荷車', kind: 'target', target: 'cart' },
  { id: 'merchant', text: '行商人', kind: 'target', target: 'merchant', aliases: ['商人'] },
  { id: 'donkey', text: 'ロバ', kind: 'target', target: 'donkey', aliases: ['驢馬'] },
  { id: 'pack', text: '荷物', kind: 'target', target: 'pack', aliases: ['荷'] },
];

// 空振りの一言：唱えた言葉が場面で何も起こさなかったとき、使いどころをほのめかす
// marks のどれかが場面の結果（文や発見メモ）に出ていれば、効いたとみなす
export const FIZZLE: Record<string, { marks: string[]; line: string }> = {
  smoke: { marks: ['煙'], line: '煙がもくもくと上がったが、だれもこちらを見ていなかった。' },
  frost: { marks: ['霜'], line: '足もとに霜が降りたが、こちらへ走ってくるものはいない。' },
  ash: { marks: ['灰'], line: '灰が舞ったが、ここには覆う火も、隠す足跡もない。' },
  quiet: { marks: ['静'], line: 'あたりがしんとした。でも、起こしたくない相手はここにいない。' },
  sleep: { marks: ['眠', '寝', 'まぶた'], line: '眠りの響きがただよったが、まぶたの重くなる相手はいなかった。' },
  echo: { marks: ['響', '山びこ', 'こだま'], line: '声がこだましたが、届く相手はいなかった。' },
  flow: { marks: ['流'], line: '水が足もとを流れていったが、押し流すものはなかった。' },
  pull: { marks: ['引き寄', '引っぱ', '手もと', '目の前'], line: '何かを引き寄せようとしたが、手に触れたのは風だけだった。' },
};

// 旅の始めに持っているワード。対象語は場面が提供するので所持に含めない
// 残りの言葉は、場面の結果や出来事で手に入れる
export const STARTING_WORDS = ['fire', 'ice', 'thunder', 'spear', 'wall'];

// 混ざって生まれる言葉：この2つをいっしょに唱えると生まれる
export const COMBOS: { ids: [string, string]; result: string }[] = [
  { ids: ['fire', 'ice'], result: 'steam' },
  { ids: ['earth', 'rain'], result: 'mud' },
  { ids: ['thunder', 'rain'], result: 'storm' },
  { ids: ['wind', 'fire'], result: 'sparks' },
];

// 持てる言葉の数（黒い言葉は数えない）
export const HAND_LIMIT = 12;

export const ELEMENT_INFO: Record<Element, { label: string; color: string }> = {
  fire: { label: '炎', color: '#e4572e' },
  ice: { label: '氷', color: '#4fb3d9' },
  thunder: { label: '雷', color: '#e8c547' },
  earth: { label: '土', color: '#a0703c' },
  wind: { label: '風', color: '#7bc67b' },
};

export const BLACK_COLOR = '#222222';
const STEAM_COLOR = '#c9d3dc';

export function wordById(id: string): Word {
  const word = WORDS.find((w) => w.id === id);
  if (!word) throw new Error(`unknown word: ${id}`);
  return word;
}

export function wordColor(word: Word): string {
  if (word.kind === 'element') return ELEMENT_INFO[word.element].color;
  if (word.kind === 'compound') return word.element ? ELEMENT_INFO[word.element].color : STEAM_COLOR;
  if (word.kind === 'black') return BLACK_COLOR;
  return '#8a8a8a';
}

export function wordHint(word: Word): string {
  return word.kind === 'target' ? '' : word.hint;
}

// 手札の上限に数える言葉
export function countsToHand(id: string): boolean {
  return wordById(id).kind !== 'black';
}
