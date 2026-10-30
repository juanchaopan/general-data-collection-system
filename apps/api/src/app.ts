import Fastify, { type FastifyInstance } from 'fastify';
import type { Config } from './shared/config.js';

/** 组装 Fastify 实例。独立于 listen，方便用 inject 测试。 */
export function buildApp(config: Config): FastifyInstance {
  const app = Fastify({ logger: { level: config.LOG_LEVEL }, requestIdHeader: 'x-request-id' });

  // 经反向代理（/api）可达的探测接口，Web 界面用它显示接口状态。
  app.get('/api/v1/health', () => ({ status: 'ok' }));
  app.get('/health/live', () => ({ status: 'ok' }));
  app.get('/health/ready', () => ({ status: 'ok', role: config.ROLE }));

  return app;
}
