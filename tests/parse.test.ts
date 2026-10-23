import { describe, expect, it } from 'vitest';
import { countLength, parseSpell } from '../src/game/parse';
import { STARTING_WORDS } from '../src/game/words';

const owned = new Set(STARTING_WORDS);

describe('parseSpell', () => {
  it('漢字の複合語を最長一致で区切る', () => {
    const s = parseSpell('岩に雷槍', owned);
    expect(s.target).toBe('rock');
    expect(s.elements).toEqual(['thunder']);
    expect(s.shapes).toEqual(['spear']);
    expect(s.usedWordIds).toEqual(['rock', 'thunder', 'spear']);
  });

  it('ひらがなはつなぎとして読み飛ばすが文字数には数える', () => {
    const s = parseSpell('炎の槍', owned);
    expect(s.elements).toEqual(['fire']);
    expect(s.shapes).toEqual(['spear']);
    expect(s.length).toBe(3);
    expect(parseSpell('炎槍', owned).length).toBe(2);
  });

  it('「女の子」は「の」を含んでも1語として読む', () => {
    const s = parseSpell('女の子に強化', owned);
    expect(s.target).toBe('girl');
    expect(s.supports).toEqual(['boost']);
  });

  it('別名でも対象を認識する', () => {
    expect(parseSpell('小川に氷', owned).target).toBe('stream');
    expect(parseSpell('枯れ木に炎', owned).target).toBe('tree');
  });

  it('辞書にあるが持っていないワードは発動しない', () => {
    const s = parseSpell('風槍', owned);
    expect(s.elements).toEqual([]);
    expect(s.tokens[0]).toMatchObject({ type: 'unowned', text: '風' });
  });

  it('辞書にない漢字は不明として扱う', () => {
    const s = parseSpell('爆炎', owned);
    expect(s.tokens[0]).toMatchObject({ type: 'unknown', text: '爆' });
    expect(s.elements).toEqual(['fire']);
  });

  it('複数の形状を重ねられる', () => {
    expect(parseSpell('炎槍雨', owned).shapes).toEqual(['spear', 'rain']);
  });

  it('文字数は空白を除いてすべて数える', () => {
    expect(countLength('岩 に 雷槍')).toBe(4);
  });
});
