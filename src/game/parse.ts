// 自由入力の呪文を辞書と照合する

import { WORDS, type Element, type Shape, type Support, type TargetId, type Trick, type Word } from './words';

export type Token =
  | { type: 'word'; text: string; wordId: string }
  | { type: 'unowned'; text: string; wordId: string }
  | { type: 'filler'; text: string }
  | { type: 'unknown'; text: string };

export interface Spell {
  input: string;
  length: number;
  tokens: Token[];
  elements: Element[];
  shapes: Shape[];
  supports: Support[];
  tricks: Trick[];
  // 色をまとった相手にも半減されない言葉が入っている
  pure: boolean;
  target: TargetId | null;
  regret: boolean;
  // 覚悟：力が増すが、痛まない
  resolve: boolean;
  // 発動に使われたワード（カード発光の順番）
  usedWordIds: string[];
}

interface Entry {
  surface: string;
  word: Word;
}

const ENTRIES: Entry[] = WORDS.flatMap((word) => {
  const surfaces = [word.text, ...(word.kind === 'target' ? word.aliases ?? [] : [])];
  return surfaces.map((surface) => ({ surface, word }));
}).sort((a, b) => b.surface.length - a.surface.length);

const HIRAGANA = /^[ぁ-ゟ]$/;
const IGNORED = /^[\s、。・！？!?ー〜]$/;

// 文字数は入力した文字をすべて数える（空白は除く）
export function countLength(input: string): number {
  return Array.from(input).filter((ch) => !/\s/.test(ch)).length;
}

/**
 * 最長一致で辞書のワードに区切る。
 * 対象語（場面のオブジェクト）は所持していなくても使える。
 * 辞書にないひらがなはつなぎの言葉として無視する。
 */
export function parseSpell(input: string, owned: ReadonlySet<string>): Spell {
  const chars = Array.from(input);
  const tokens: Token[] = [];
  let i = 0;
  let pendingUnknown = '';
  let pendingFiller = '';

  const flush = () => {
    if (pendingUnknown) tokens.push({ type: 'unknown', text: pendingUnknown });
    if (pendingFiller) tokens.push({ type: 'filler', text: pendingFiller });
    pendingUnknown = '';
    pendingFiller = '';
  };

  while (i < chars.length) {
    const rest = chars.slice(i).join('');
    const entry = ENTRIES.find((e) => rest.startsWith(e.surface));
    if (entry) {
      flush();
      const isOwned = entry.word.kind === 'target' || owned.has(entry.word.id);
      tokens.push({
        type: isOwned ? 'word' : 'unowned',
        text: entry.surface,
        wordId: entry.word.id,
      });
      i += Array.from(entry.surface).length;
      continue;
    }
    const ch = chars[i];
    if (IGNORED.test(ch)) {
      flush();
    } else if (HIRAGANA.test(ch)) {
      if (pendingUnknown) flush();
      pendingFiller += ch;
    } else {
      if (pendingFiller) flush();
      pendingUnknown += ch;
    }
    i += 1;
  }
  flush();
  return buildSpell(input, tokens);
}

/** 区切った言葉から呪文の中身を組み立てる（言葉を1つ抜いて試すときにも使う） */
export function buildSpell(input: string, tokens: Token[]): Spell {
  const spell: Spell = {
    input,
    length: countLength(input),
    tokens,
    elements: [],
    shapes: [],
    supports: [],
    tricks: [],
    pure: false,
    target: null,
    regret: false,
    resolve: false,
    usedWordIds: [],
  };

  for (const token of tokens) {
    if (token.type !== 'word') continue;
    const word = WORDS.find((w) => w.id === token.wordId)!;
    spell.usedWordIds.push(word.id);
    switch (word.kind) {
      case 'element':
        if (!spell.elements.includes(word.element)) spell.elements.push(word.element);
        break;
      case 'shape':
        spell.shapes.push(word.shape);
        break;
      case 'compound':
        if (word.element && !spell.elements.includes(word.element)) spell.elements.push(word.element);
        spell.shapes.push(...word.shapes);
        for (const t of word.tricks ?? []) if (!spell.tricks.includes(t)) spell.tricks.push(t);
        if (word.pure) spell.pure = true;
        break;
      case 'trick':
        if (!spell.tricks.includes(word.trick)) spell.tricks.push(word.trick);
        break;
      case 'support':
        if (!spell.supports.includes(word.support)) spell.supports.push(word.support);
        break;
      case 'black':
        spell.regret = true;
        break;
      case 'white':
        spell.resolve = true;
        break;
      case 'target':
        // 最初に出てきた対象を採用する
        if (spell.target === null) spell.target = word.target;
        break;
    }
  }
  return spell;
}

export const ATTACK_SHAPES: Shape[] = ['spear', 'blade', 'rain', 'chain'];

export function isAttack(spell: Spell): boolean {
  return spell.shapes.some((s) => ATTACK_SHAPES.includes(s)) ||
    (spell.elements.length > 0 && spell.shapes.length === 0 && spell.supports.length === 0);
}

export function isEmpty(spell: Spell): boolean {
  return spell.usedWordIds.length === 0;
}
