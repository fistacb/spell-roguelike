// 崖の旅人：山道の崖から、旅人が落ちかけている

import { isAttack, isEmpty } from '../parse';
import { emptyOutcome, outcome, REGRET_LINE, type Outcome, type SceneDef } from '../scene';

function rescued(o: Outcome, line: string, discovery: string): Outcome {
  o.log.push(line, '旅人を崖の上に引き上げた！', '旅人「命の恩人だ！」 旅人は、荷を縛る鎖の結び方を教えてくれた。ハートが1つ増えた。');
  o.hearts += 1;
  o.reward = 'chain';
  o.discoveries.push(discovery);
  o.summary = '崖から旅人を助けた';
  return o;
}

function fell(o: Outcome, ...lines: string[]): Outcome {
  o.gainRegret = true;
  o.log.push(...lines, '旅人の手がすべり、崖下の茂みに落ちていった……。下から「だいじょうぶだ……」と弱々しい声がした。', REGRET_LINE);
  o.summary = '旅人を助けられなかった';
  return o;
}

export const cliff: SceneDef = {
  id: 'cliff',
  title: '崖の旅人',
  kind: 'event',
  intro: () => ['山道の崖っぷちから、助けを呼ぶ声がする。', '旅人が、崖から生えた木の根に片手でぶら下がっている！'],
  objects: () => [
    { id: 'traveler', label: '🧗 旅人', keyword: '旅人', desc: '手がしびれてきている。もう長くはもたない。', color: '#e8d7b5' },
    { id: 'root', label: '🌿 木の根', keyword: '木の根', desc: '細くて、今にも抜けそう。', color: '#bcd6b0' },
    { id: 'cliff', label: '⛰️ 崖', keyword: '崖', desc: '切り立った岩壁。足場があれば登れそう。', color: '#c9b9a0' },
  ],
  resolve(spell, ctx) {
    const o = emptyOutcome();
    if (isEmpty(spell)) return outcome(fell(o, '呪文は何も起こさなかった。'));
    const target = spell.target ?? (spell.shapes.includes('wall') ? 'cliff' : 'traveler');
    switch (target) {
      case 'traveler':
        if (spell.shapes.includes('chain') || spell.supports.includes('pull')) {
          return outcome(rescued(o, spell.shapes.includes('chain') ? '鎖が旅人の腕に巻きついた。' : '✦ 旅人の体がふわりと浮き、こちらへ引き寄せられた。', '鎖・引き寄せ×旅人：引き上げられる'));
        }
        if (spell.supports.includes('boost') || spell.supports.includes('heal')) {
          return outcome(rescued(o, '旅人の腕に力が戻り、自分でぐいっと体を持ち上げた。', '強化・癒し×旅人：自分で登れる'));
        }
        if (isAttack(spell)) {
          if (!ctx.warned) return { kind: 'warning', message: '旅人に向けて攻撃の呪文を唱えようとしている。本当に唱える？' };
          return outcome(fell(o, '呪文が旅人をかすめた。'));
        }
        return outcome(fell(o, '旅人「は、早く……！」'));
      case 'root':
        if (spell.supports.includes('boost') || spell.supports.includes('heal')) {
          return outcome(rescued(o, '木の根がぐんぐん太く伸び、旅人を崖の上まで持ち上げた。', '強化・癒し×木の根：伸びて持ち上げる'));
        }
        if (spell.elements.includes('ice')) return outcome(rescued(o, '木の根が凍って、がっちりと固まった。旅人は根を足場によじ登ってきた。', '氷×木の根：固まって足場になる'));
        if (spell.elements.includes('fire') || spell.shapes.includes('blade')) return outcome(fell(o, '木の根がぷつりと切れた。'));
        return outcome(fell(o, '木の根がみしみしと音を立てた。'));
      case 'cliff':
        if (spell.shapes.includes('wall') || (spell.elements.includes('earth') && !isAttack(spell))) {
          return outcome(rescued(o, '岩壁から足場がせり出した。旅人は足をかけて登ってきた。', '壁・土×崖：足場ができる'));
        }
        if (isAttack(spell)) return outcome(fell(o, '崖が崩れて、小石が旅人の上に降りそそいだ。'));
        return outcome(fell(o, '崖はしんとしている。'));
      default:
        return outcome(fell(o, 'それはここにはない。'));
    }
  },
};
