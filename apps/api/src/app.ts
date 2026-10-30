import Fastify, { type FastifyInstance } from 'fastify';
import type { Config } from './shared/config.js';

/** 组装 Fastify 实例。独立于 listen，方便用 inject 测试。 */
export function buildApp(config: Config): FastifyInstance {
  const app = Fastify({ logger: { level: config.LOG_LEVEL }, requestIdHeader: 'x-request-id' });

  app.get('/health/live', () => ({ status: 'ok' }));
  app.get('/health/ready', () => ({ status: 'ok', role: config.ROLE }));

  return app;
}
