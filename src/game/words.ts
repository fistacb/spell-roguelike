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
  | 'merchant' | 'donkey' | 'pack'
  | 'mill' | 'channel' | 'miller' | 'goat' | 'rope' | 'imps' | 'henhouse' | 'torch'
  | 'mire' | 'carriage' | 'horse' | 'guard' | 'gate' | 'tower' | 'roof' | 'bell' | 'stage' | 'juggler' | 'crowd'
  | 'warden' | 'shrine' | 'offering' | 'web' | 'spider' | 'trees' | 'wisp' | 'signpost'
  | 'hearth' | 'door' | 'blizzard' | 'traveler' | 'root' | 'cliff' | 'catfish' | 'riverbed' | 'sluice' | 'paddy' | 'farmer'
  | 'bees' | 'hivebox' | 'straw' | 'steel' | 'tub' | 'furnace' | 'icefall' | 'crack' | 'icicle' | 'yeti' | 'campfire' | 'cave'
  | 'rubble' | 'beam' | 'miner' | 'net' | 'otter' | 'fisher' | 'kappa' | 'dish' | 'cucumber' | 'reservoir' | 'cloud' | 'drum'
  | 'snare' | 'fawn' | 'hunter' | 'thorn' | 'birds' | 'oldtree' | 'serpent' | 'sunspot' | 'bush'
  | 'mark' | 'prize' | 'keeper' | 'charcoal' | 'brazier' | 'guests' | 'thief' | 'purse' | 'throng';

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
    id: 'storm', text: '嵐', kind: 'compound', element: 'thunder', shapes: ['rain'],
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
  { id: 'stream', text: '川', kind: 'target', target: 'stream', aliases: ['小川', '谷川', '水'] },
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
  { id: 'river', text: '激流', kind: 'target', target: 'river', aliases: ['大川'] },
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
  { id: 'mill', text: '水車', kind: 'target', target: 'mill', aliases: ['羽根'] },
  { id: 'channel', text: '水路', kind: 'target', target: 'channel' },
  { id: 'miller', text: '粉屋', kind: 'target', target: 'miller' },
  { id: 'goat', text: '子ヤギ', kind: 'target', target: 'goat', aliases: ['ヤギ', '山羊'] },
  { id: 'rope', text: '縄', kind: 'target', target: 'rope', aliases: ['ロープ'] },
  { id: 'imps', text: '小鬼たち', kind: 'target', target: 'imps', aliases: ['仲間'] },
  { id: 'henhouse', text: '鶏小屋', kind: 'target', target: 'henhouse', aliases: ['鶏', 'ニワトリ'] },
  { id: 'torch', text: '松明', kind: 'target', target: 'torch', aliases: ['たいまつ'] },
  { id: 'mire', text: 'ぬかるみ', kind: 'target', target: 'mire', aliases: ['泥道'] },
  { id: 'carriage', text: '馬車', kind: 'target', target: 'carriage', aliases: ['車輪'] },
  { id: 'horse', text: '馬', kind: 'target', target: 'horse' },
  { id: 'guard', text: '番兵', kind: 'target', target: 'guard', aliases: ['兵士'] },
  { id: 'gate', text: '門', kind: 'target', target: 'gate', aliases: ['関所'] },
  { id: 'tower', text: '塔', kind: 'target', target: 'tower' },
  { id: 'roof', text: '屋根', kind: 'target', target: 'roof' },
  { id: 'bell', text: '鐘', kind: 'target', target: 'bell' },
  { id: 'stage', text: '舞台', kind: 'target', target: 'stage', aliases: ['空'] },
  { id: 'juggler', text: '芸人', kind: 'target', target: 'juggler', aliases: ['座長'] },
  { id: 'crowd', text: '見物人', kind: 'target', target: 'crowd', aliases: ['観客'] },
  { id: 'warden', text: '番人', kind: 'target', target: 'warden', aliases: ['石像'] },
  { id: 'shrine', text: '祠', kind: 'target', target: 'shrine', aliases: ['灯明'] },
  { id: 'offering', text: '供え物', kind: 'target', target: 'offering', aliases: ['供え物台'] },
  { id: 'web', text: '蜘蛛の巣', kind: 'target', target: 'web', aliases: ['糸'] },
  { id: 'spider', text: '蜘蛛', kind: 'target', target: 'spider', aliases: ['大蜘蛛'] },
  { id: 'trees', text: '木々', kind: 'target', target: 'trees', aliases: ['枝'] },
  { id: 'wisp', text: '鬼火', kind: 'target', target: 'wisp' },
  { id: 'signpost', text: '道しるべ', kind: 'target', target: 'signpost', aliases: ['看板'] },
  { id: 'hearth', text: '暖炉', kind: 'target', target: 'hearth', aliases: ['薪'] },
  { id: 'door', text: '戸口', kind: 'target', target: 'door', aliases: ['戸', '入り口'] },
  { id: 'blizzard', text: '吹雪', kind: 'target', target: 'blizzard' },
  { id: 'traveler', text: '旅人', kind: 'target', target: 'traveler' },
  { id: 'root', text: '木の根', kind: 'target', target: 'root', aliases: ['根'] },
  { id: 'cliff', text: '崖', kind: 'target', target: 'cliff', aliases: ['岩壁'] },
  { id: 'catfish', text: 'ナマズ', kind: 'target', target: 'catfish', aliases: ['大ナマズ', '鯰', '主'] },
  { id: 'riverbed', text: '岸', kind: 'target', target: 'riverbed', aliases: ['岸辺'] },
  { id: 'sluice', text: '水門', kind: 'target', target: 'sluice' },
  { id: 'paddy', text: '田んぼ', kind: 'target', target: 'paddy', aliases: ['稲', '田'] },
  { id: 'farmer', text: '農夫', kind: 'target', target: 'farmer' },
  { id: 'bees', text: '蜂たち', kind: 'target', target: 'bees', aliases: ['ミツバチ', '蜂'] },
  { id: 'hivebox', text: '巣箱', kind: 'target', target: 'hivebox' },
  { id: 'straw', text: 'わら', kind: 'target', target: 'straw', aliases: ['藁', '濡れたわら'] },
  { id: 'steel', text: '鋼', kind: 'target', target: 'steel', aliases: ['焼けた鋼', '刀'] },
  { id: 'tub', text: '水桶', kind: 'target', target: 'tub', aliases: ['桶'] },
  { id: 'furnace', text: '炉', kind: 'target', target: 'furnace', aliases: ['ふいご'] },
  { id: 'icefall', text: '滝', kind: 'target', target: 'icefall', aliases: ['氷瀑', '凍った滝'] },
  { id: 'crack', text: 'ひび', kind: 'target', target: 'crack', aliases: ['割れ目'] },
  { id: 'icicle', text: 'つらら', kind: 'target', target: 'icicle', aliases: ['氷柱'] },
  { id: 'yeti', text: '雪男', kind: 'target', target: 'yeti' },
  { id: 'campfire', text: '焚き火', kind: 'target', target: 'campfire', aliases: ['焚火'] },
  { id: 'cave', text: '洞穴', kind: 'target', target: 'cave', aliases: ['ほら穴', 'ねぐら'] },
  { id: 'rubble', text: '瓦礫', kind: 'target', target: 'rubble' },
  { id: 'beam', text: '坑木', kind: 'target', target: 'beam', aliases: ['柱', '天井'] },
  { id: 'miner', text: '坑夫', kind: 'target', target: 'miner', aliases: ['鉱夫'] },
  { id: 'net', text: '網', kind: 'target', target: 'net', aliases: ['漁網'] },
  { id: 'otter', text: 'カワウソ', kind: 'target', target: 'otter', aliases: ['かわうそ'] },
  { id: 'fisher', text: '漁師', kind: 'target', target: 'fisher' },
  { id: 'kappa', text: '河童', kind: 'target', target: 'kappa', aliases: ['かっぱ', 'カッパ'] },
  { id: 'dish', text: '皿', kind: 'target', target: 'dish', aliases: ['頭の皿'] },
  { id: 'cucumber', text: 'きゅうり', kind: 'target', target: 'cucumber', aliases: ['キュウリ', '胡瓜'] },
  { id: 'reservoir', text: '溜め池', kind: 'target', target: 'reservoir', aliases: ['ため池'] },
  { id: 'cloud', text: '雲', kind: 'target', target: 'cloud', aliases: ['雨雲'] },
  { id: 'drum', text: '太鼓', kind: 'target', target: 'drum' },
  { id: 'snare', text: '罠', kind: 'target', target: 'snare', aliases: ['くくり罠'] },
  { id: 'fawn', text: '子鹿', kind: 'target', target: 'fawn', aliases: ['鹿'] },
  { id: 'hunter', text: '狩人', kind: 'target', target: 'hunter', aliases: ['猟師'] },
  { id: 'thorn', text: '茨', kind: 'target', target: 'thorn', aliases: ['いばら', 'とげ'] },
  { id: 'birds', text: '小鳥', kind: 'target', target: 'birds', aliases: ['鳥'] },
  { id: 'oldtree', text: '古木', kind: 'target', target: 'oldtree' },
  { id: 'serpent', text: '大蛇', kind: 'target', target: 'serpent', aliases: ['蛇', 'ヘビ'] },
  { id: 'sunspot', text: '日だまり', kind: 'target', target: 'sunspot', aliases: ['日なた'] },
  { id: 'bush', text: '草むら', kind: 'target', target: 'bush', aliases: ['茂み'] },
  { id: 'mark', text: '的', kind: 'target', target: 'mark', aliases: ['的当て'] },
  { id: 'prize', text: '景品', kind: 'target', target: 'prize' },
  { id: 'keeper', text: '店主', kind: 'target', target: 'keeper', aliases: ['親父'] },
  { id: 'charcoal', text: '炭', kind: 'target', target: 'charcoal' },
  { id: 'brazier', text: '火鉢', kind: 'target', target: 'brazier' },
  { id: 'guests', text: '客', kind: 'target', target: 'guests', aliases: ['旅の客', '客たち'] },
  { id: 'thief', text: 'スリ', kind: 'target', target: 'thief', aliases: ['泥棒'] },
  { id: 'purse', text: '財布', kind: 'target', target: 'purse', aliases: ['巾着'] },
  { id: 'throng', text: '人ごみ', kind: 'target', target: 'throng', aliases: ['人混み'] },
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
