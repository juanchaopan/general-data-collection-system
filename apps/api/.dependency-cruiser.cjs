// 架构规则，按 ADR-0004：每个模块内部 routes → services → repositories → domain；
// 模块之间只能通过对方的 index.ts，且只能依赖 docs/architecture/overview.md "后端模块和允许的依赖"表里列出的模块；
// 不允许循环依赖。由 scripts/arch-check.mjs 运行（pnpm arch），违反任何一条，自检和 CI 都会失败。

// 允许的模块依赖图（与架构文档的表保持一致；改这里要先改文档并经评审）。
const allowedModuleDeps = {
  iam: ['audit'],
  organizations: ['iam', 'audit'],
  periods: ['audit'],
  coa: ['audit'],
  templates: ['coa', 'periods', 'audit'],
  collection: ['templates', 'organizations', 'iam', 'coa', 'audit'],
  notifications: ['iam', 'organizations'],
  audit: [],
};
const modules = Object.keys(allowedModuleDeps);
const moduleAlt = modules.join('|');

const moduleDepRules = modules.map((name) => {
  const allowed = [name, 'shared', ...allowedModuleDeps[name]].join('|');
  return {
    name: `module-deps-${name}`,
    comment: `${name} 只能依赖：${allowedModuleDeps[name].join('、') || '（无）'}（架构文档的允许依赖表）。`,
    severity: 'error',
    from: { path: `^src/${name}/` },
    to: { path: `^src/(${moduleAlt})/`, pathNot: `^src/(${allowed})/` },
  };
});

const dbAndWebPackages =
  '(^|/)node_modules/(fastify|express|@fastify|pg|pg-boss|drizzle-orm|postgres|kysely|mysql2|mongodb)(/|$)';

module.exports = {
  forbidden: [
    {
      name: 'routes-not-imported-by-inner-layers',
      comment: 'routes 是最外层，里面的层不能反过来依赖它。',
      severity: 'error',
      from: { path: `^src/(${moduleAlt})/(services|repositories|domain)/` },
      to: { path: '/routes/' },
    },
    {
      name: 'repositories-only-from-services',
      comment: '数据访问只能由 services 调用，routes 和 domain 不能直接访问 repositories。',
      severity: 'error',
      from: { path: '/(routes|domain)/' },
      to: { path: '/repositories/' },
    },
    {
      name: 'domain-is-pure',
      comment: '领域层只放业务规则，不依赖其他层、Web 框架和数据库驱动。',
      severity: 'error',
      from: { path: '/domain/' },
      to: { path: ['/(routes|services|repositories)/', dbAndWebPackages] },
    },
    {
      name: 'services-not-framework-bound',
      comment: 'services 不依赖 Web 框架（只允许引用类型），业务逻辑可以脱离 HTTP 单独测试。',
      severity: 'error',
      from: { path: '/services/' },
      to: {
        path: '(^|/)node_modules/(fastify|express|@fastify)(/|$)',
        dependencyTypesNot: ['type-only'],
      },
    },
    {
      name: 'cross-module-only-via-index',
      comment:
        '模块 A 要用模块 B，只能 import B 的 index.ts，不能引用 B 内部的文件（ADR-0004 第 2 条）。',
      severity: 'error',
      from: { path: `^src/(${moduleAlt})/` },
      to: {
        path: `^src/(${moduleAlt})/`,
        pathNot: ['^src/$1/', '^src/[^/]+/index[.]ts$'],
      },
    },
    ...moduleDepRules,
    {
      name: 'shared-independent',
      comment: 'shared 不依赖任何业务模块（ADR-0004 第 7 条）。',
      severity: 'error',
      from: { path: '^src/shared/' },
      to: { path: `^src/(${moduleAlt})/` },
    },
    {
      name: 'no-circular',
      comment: '不允许循环依赖。',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '[.]test[.]ts$' },
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
  },
};
