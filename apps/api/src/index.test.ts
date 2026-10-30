import { describe, expect, it } from 'vitest';
import { buildApp } from './app.js';
import { loadConfig } from './shared/config.js';

describe('健康检查', () => {
  it('live 返回 ok', async () => {
    const app = buildApp(loadConfig({ LOG_LEVEL: 'fatal' }));
    const res = await app.inject({ method: 'GET', url: '/health/live' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });

  it('缺少合法配置时启动失败', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow();
  });
});
