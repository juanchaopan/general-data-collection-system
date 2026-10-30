#!/usr/bin/env node
// 架构检查：用 dependency-cruiser 按 .dependency-cruiser.cjs 的规则检查模块之间的依赖。
// dependency-cruiser 读不懂源码时（例如装了它还不支持的 TypeScript 版本）不会报错，而是"0 个模块、0 个违规"地通过，
// 所以这里一个模块都没分析到时也算失败。
// 已有项目接入时，可以把现存的违规记成基线（.dependency-cruiser-known-violations.json）：基线里的旧违规不算失败，
// 新增的违规照样失败。旧违规修掉以后重新生成基线，基线只会越来越小。
// 用法：node scripts/arch-check.mjs [源码目录，默认 src]
//       node scripts/arch-check.mjs --baseline [源码目录]   记录或更新基线
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const BASELINE = '.dependency-cruiser-known-violations.json';
const args = process.argv.slice(2);
const writeBaseline = args[0] === '--baseline';
const sourceDir = (writeBaseline ? args[1] : args[0]) ?? 'src';

const depcruise = (extra) =>
  spawnSync(
    'npx',
    ['--no-install', 'depcruise', sourceDir, '--config', '.dependency-cruiser.cjs', ...extra],
    {
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
      shell: process.platform === 'win32',
    },
  );

if (writeBaseline) {
  const result = depcruise(['--output-type', 'baseline', '--output-to', BASELINE]);
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(1);
  }
  console.log(`已把现存的违规记进 ${BASELINE}。新增的违规仍会让检查失败。`);
  process.exit(0);
}

const useBaseline = existsSync(BASELINE);
const result = depcruise([
  '--output-type',
  'json',
  ...(useBaseline ? ['--ignore-known', BASELINE] : []),
]);

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  console.error(`dependency-cruiser 没有正常运行：\n${result.stderr || result.stdout}`);
  process.exit(1);
}

const { summary } = report;
if (summary.totalCruised === 0) {
  console.error(
    `架构检查没有分析到任何模块，检查等于没做。常见原因：装了 dependency-cruiser 还不支持的 TypeScript 版本，` +
      `或者源码目录（${sourceDir}）不对。\n${result.stderr}`,
  );
  process.exit(1);
}

const errors = summary.violations.filter((v) => v.rule.severity === 'error');
for (const v of errors) {
  console.error(`error ${v.rule.name}: ${v.from} → ${v.to}`);
}
const ignored = summary.ignore ?? 0;
console.log(
  `架构检查：分析了 ${summary.totalCruised} 个模块，${errors.length} 个违规` +
    (useBaseline ? `（另有 ${ignored} 个基线里的旧违规，见 ${BASELINE}）` : '') +
    '。',
);
process.exit(errors.length > 0 ? 1 : 0);
