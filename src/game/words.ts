// 辞書。ゲームに存在するワードの一覧（所持しているかどうかは別に管理する）

export type Element = 'fire' | 'ice' | 'thunder' | 'earth' | 'wind';
export type Shape = 'spear' | 'blade' | 'rain' | 'wall' | 'chain';
export type Support = 'boost' | 'heal';
// 出来事から生まれる、攻撃ではない小技
export type Trick = 'smoke' | 'frost';
export type TargetId =
  | 'rock' | 'girl' | 'tree' | 'stream' | 'imp' | 'self' | 'enemy'
  | 'wolf' | 'bridge' | 'barn' | 'villager' | 'well'
  | 'bear' | 'hive' | 'slime' | 'swamp' | 'grass'
  | 'crow' | 'scarecrow' | 'field' | 'river' | 'boat' | 'boatman' | 'fog' | 'lantern' | 'owl' | 'boulder';

export type Word =
  | { id: string; text: string; kind: 'element'; element: Element }
  | { id: string; text: string; kind: 'shape'; shape: Shape }
  | { id: string; text: string; kind: 'support'; support: Support }
  | { id: string; text: string; kind: 'compound'; element: Element; shape: Shape }
  | { id: string; text: string; kind: 'trick'; trick: Trick }
  | { id: string; text: string; kind: 'black'; black: 'regret' }
  | { id: string; text: string; kind: 'target'; target: TargetId; aliases?: string[] };

export const WORDS: Word[] = [
  { id: 'fire', text: '炎', kind: 'element', element: 'fire' },
  { id: 'ice', text: '氷', kind: 'element', element: 'ice' },
  { id: 'thunder', text: '雷', kind: 'element', element: 'thunder' },
  { id: 'earth', text: '土', kind: 'element', element: 'earth' },
  { id: 'wind', text: '風', kind: 'element', element: 'wind' },
  { id: 'spear', text: '槍', kind: 'shape', shape: 'spear' },
  { id: 'blade', text: '刃', kind: 'shape', shape: 'blade' },
  { id: 'rain', text: '雨', kind: 'shape', shape: 'rain' },
  { id: 'wall', text: '壁', kind: 'shape', shape: 'wall' },
  { id: 'chain', text: '鎖', kind: 'shape', shape: 'chain' },
  { id: 'boost', text: '強化', kind: 'support', support: 'boost' },
  { id: 'heal', text: '癒し', kind: 'support', support: 'heal' },
  { id: 'regret', text: '後悔', kind: 'black', black: 'regret' },
  // 出来事ワード：起こした出来事がそのまま言葉になる
  { id: 'smoke', text: '煙', kind: 'trick', trick: 'smoke' },
  { id: 'frost', text: '霜', kind: 'trick', trick: 'frost' },
  { id: 'gravel', text: '礫', kind: 'compound', element: 'earth', shape: 'rain' },
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
];

// 旅の始めに持っているワード。対象語は場面が提供するので所持に含めない
// 残りの言葉は、場面の結果や出来事で手に入れる
export const STARTING_WORDS = ['fire', 'ice', 'thunder', 'spear', 'wall'];

export const ELEMENT_INFO: Record<Element, { label: string; color: string }> = {
  fire: { label: '炎', color: '#e4572e' },
  ice: { label: '氷', color: '#4fb3d9' },
  thunder: { label: '雷', color: '#e8c547' },
  earth: { label: '土', color: '#a0703c' },
  wind: { label: '風', color: '#7bc67b' },
};

export const BLACK_COLOR = '#222222';

export function wordById(id: string): Word {
  const word = WORDS.find((w) => w.id === id);
  if (!word) throw new Error(`unknown word: ${id}`);
  return word;
}

export function wordColor(word: Word): string {
  if (word.kind === 'element' || word.kind === 'compound') return ELEMENT_INFO[word.element].color;
  if (word.kind === 'black') return BLACK_COLOR;
  return '#8a8a8a';
}
