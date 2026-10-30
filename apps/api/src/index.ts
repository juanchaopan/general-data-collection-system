import { buildApp } from './app.js';
import { loadConfig } from './shared/config.js';

const config = loadConfig();
const app = buildApp(config);

async function shutdown(signal: string): Promise<void> {
  app.log.info({ signal }, '收到停机信号，处理完手上的请求后退出');
  await app.close();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

await app.listen({ port: config.PORT, host: '0.0.0.0' });
