// 言葉の使い道表を表示する：npm run words
import { buildUsageReport, LIMITS } from '../src/game/usage';

const pct = (n: number) => `${Math.round(n * 100)}%`;
const report = buildUsageReport();

console.log('■ 言葉ごとの使い道（得＝状況が変わって得をした、軽くするだけ＝結果は同じでハートの減りが軽くなった）');
console.log('言葉\t得の場面\t軽くするだけ\t損の場面\t地域\t旅1回の見こみ\t万能度\tかぶり\t警告');
for (const w of [...report.words].sort((a, b) => a.goodScenes.length - b.goodScenes.length)) {
  console.log([
    w.text, w.goodScenes.length, w.softenScenes.length, w.badScenes.length, w.regions.length, w.expected.toFixed(1),
    pct(w.versatility), w.overlap.toFixed(1), w.warnings.length ? `⚠ ${w.warnings.join('・')}` : '',
  ].join('\t'));
}

console.log('\n■ 場面ごとの抜け道');
console.log('場面\t地域\t出会う見こみ\t得になる言葉');
for (const s of [...report.scenes].sort((a, b) => a.goodWords.length - b.goodWords.length)) {
  console.log([s.title, s.region, s.appearance.toFixed(2), `${s.goodWords.length}種類（${s.goodWords.join('・')}）`, s.warnings.length ? `⚠ ${s.warnings.join('・')}` : ''].join('\t'));
}

const warned = report.words.filter((w) => w.warnings.length).length + report.scenes.filter((s) => s.warnings.length).length;
console.log(`\n目安：得の場面${LIMITS.minScenes}つ以上・地域${LIMITS.minRegions}つ以上・万能度${pct(LIMITS.maxVersatility)}まで・場面ごとに${LIMITS.minWaysPerScene}種類以上`);
console.log(warned ? `⚠ 目安から外れたものが${warned}件あります` : '目安から外れたものはありません');
