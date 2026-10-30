import { describe, expect, it } from 'vitest';
import { referencedCells } from './index.js';

describe('referencedCells', () => {
  it('找出公式引用的单元格并去重', () => {
    expect(referencedCells('A1+B2+$A$1')).toEqual(['A1', 'B2']);
  });

  it('没有引用时返回空数组', () => {
    expect(referencedCells('1+2')).toEqual([]);
  });
});
