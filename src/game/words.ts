// 辞書。ゲームに存在するワードの一覧（所持しているかどうかは別に管理する）

export type Element = 'fire' | 'ice' | 'thunder' | 'earth' | 'wind';
export type Shape = 'spear' | 'blade' | 'rain' | 'wall' | 'chain';
export type Support = 'boost' | 'heal';
export type TargetId = 'rock' | 'girl' | 'tree' | 'stream' | 'imp' | 'self';

export type Word =
  | { id: string; text: string; kind: 'element'; element: Element }
  | { id: string; text: string; kind: 'shape'; shape: Shape }
  | { id: string; text: string; kind: 'support'; support: Support }
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
  { id: 'rock', text: '岩', kind: 'target', target: 'rock' },
  { id: 'girl', text: '女の子', kind: 'target', target: 'girl', aliases: ['少女'] },
  { id: 'tree', text: '木', kind: 'target', target: 'tree', aliases: ['枯れ木', '枯木'] },
  { id: 'stream', text: '川', kind: 'target', target: 'stream', aliases: ['小川'] },
  { id: 'imp', text: '小鬼', kind: 'target', target: 'imp', aliases: ['鬼'] },
  { id: 'self', text: '自分', kind: 'target', target: 'self', aliases: ['私', '僕'] },
];

// 旅の始めに持っているワード。対象語は場面が提供するので所持に含めない
export const STARTING_WORDS = [
  'fire', 'ice', 'thunder', 'earth',
  'spear', 'blade', 'rain', 'wall', 'chain',
  'boost', 'heal',
];

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
  if (word.kind === 'element') return ELEMENT_INFO[word.element].color;
  if (word.kind === 'black') return BLACK_COLOR;
  return '#8a8a8a';
}
