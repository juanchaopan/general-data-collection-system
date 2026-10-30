import { describe, expect, it } from 'vitest';
import { translate } from './index.js';

describe('translate', () => {
  it('按语言返回文案', () => {
    expect(translate('fr', 'app.title')).toContain('Système');
  });

  it('缺失的键返回键本身', () => {
    expect(translate('en', 'no.such.key')).toBe('no.such.key');
  });
});
