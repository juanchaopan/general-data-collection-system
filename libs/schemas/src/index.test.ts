import { describe, expect, it } from 'vitest';
import { problemSchema } from './index.js';

describe('problemSchema', () => {
  it('接受带错误码的 problem', () => {
    const parsed = problemSchema.parse({ title: '未登录', status: 401, code: 'AUTH_REQUIRED' });
    expect(parsed.type).toBe('about:blank');
  });

  it('拒绝没有错误码的 problem', () => {
    expect(problemSchema.safeParse({ title: 'x', status: 500 }).success).toBe(false);
  });
});
