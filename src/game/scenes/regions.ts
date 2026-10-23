// 地域：ステージごとに1つ選ばれ、その地域の場面が優先して起きる

export type RegionId = 'home' | 'mountain' | 'river' | 'forest' | 'road';

export interface Region {
  name: string;
  // この地域で起きる場面（足りない分は、まだ起きていない他の場面で埋める）
  scenes: string[];
}

export const REGIONS: Record<RegionId, Region> = {
  home: { name: '故郷の村はずれ', scenes: ['barn', 'crows'] },
  mountain: { name: '山道', scenes: ['bear', 'wolves'] },
  river: { name: '川沿いの道', scenes: ['ferry', 'slime'] },
  forest: { name: '霧の森', scenes: ['fog'] },
  road: { name: '街道', scenes: [] },
};

// 分かれ道に並ぶ、言葉で切り開く地域
export const OPENABLE_REGIONS: RegionId[] = ['mountain', 'river', 'forest'];
