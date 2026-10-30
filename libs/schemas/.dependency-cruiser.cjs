// 共享包的架构规则：不依赖任何应用，不允许循环依赖。由 scripts/arch-check.mjs 运行（pnpm arch）。
module.exports = {
  forbidden: [
    {
      name: 'libs-independent-of-apps',
      comment: '共享包不依赖任何应用。',
      severity: 'error',
      from: {},
      to: { path: '(^|/)apps/' },
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
