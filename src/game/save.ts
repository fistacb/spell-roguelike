// localStorage への保存。消えても遊べるように、読み書きの失敗は無視する

export interface RunRecord {
  date: string;
  result: 'win' | 'lose';
  spells: string[];
  gainedWords: string[];
  discoveries: string[];
}

export interface SaveData {
  version: 1;
  runs: RunRecord[];
  // 旅をまたいで覚えている反応。オブジェクトをタップすると確認できる
  discoveries: string[];
  // 将来の魔王などを入れる「世界の記録」の入れ物
  world: Record<string, unknown>;
}

const KEY = 'spell-roguelike:v1';

export function emptySave(): SaveData {
  return { version: 1, runs: [], discoveries: [], world: {} };
}

export function loadSave(storage: Storage | undefined = safeStorage()): SaveData {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return emptySave();
    const data = JSON.parse(raw) as SaveData;
    if (data.version !== 1) return emptySave();
    return { ...emptySave(), ...data };
  } catch {
    return emptySave();
  }
}

export function writeSave(data: SaveData, storage: Storage | undefined = safeStorage()): void {
  try {
    storage?.setItem(KEY, JSON.stringify(data));
  } catch {
    // 保存できない環境（プライベートモードなど）では何もしない
  }
}

export function addRun(data: SaveData, record: RunRecord): SaveData {
  return {
    ...data,
    runs: [...data.runs, record],
    discoveries: [...data.discoveries, ...record.discoveries.filter((d) => !data.discoveries.includes(d))],
  };
}

function safeStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}
