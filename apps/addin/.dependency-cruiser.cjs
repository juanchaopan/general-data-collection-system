// 架构规则：页面（容器）和展示组件的分层、功能之间的隔离。说明见 .claude/rules/ 里本组件的规范。
// 由 scripts/arch-check.mjs 运行（npm run arch），违反任何一条，自检和 CI 都会失败。
module.exports = {
  forbidden: [
    {
      name: 'presentational-no-data-access',
      comment:
        '展示组件只管显示：不依赖 data-access、页面和 app 层。需要的数据由页面通过 props 传进来。',
      severity: 'error',
      from: { path: '^src/(features/[^/]+/components|shared/ui)/' },
      to: {
        path: '^src/(features/[^/]+/(data-access|pages)|app)/',
        dependencyTypesNot: ['type-only'],
      },
    },
    {
      name: 'presentational-no-data-libraries',
      comment: '展示组件不取数据、不访问全局状态。',
      severity: 'error',
      from: { path: '^src/(features/[^/]+/components|shared/ui)/' },
      to: { path: '@tanstack/react-query|axios|swr|zustand|@reduxjs/toolkit|react-redux|jotai' },
    },
    {
      name: 'data-access-no-ui',
      comment: 'data-access 不依赖界面。',
      severity: 'error',
      from: { path: '^src/features/[^/]+/data-access/' },
      to: { path: '^src/(features/[^/]+/(pages|components)|shared/ui)/' },
    },
    {
      name: 'features-isolated',
      comment: '功能之间不互相引用，几个功能共用的东西放进 shared/。',
      severity: 'error',
      from: { path: '^src/features/([^/]+)/' },
      to: { path: '^src/features/[^/]+/', pathNot: '^src/features/$1/' },
    },
    {
      name: 'shared-independent',
      comment: 'shared 不依赖任何功能。',
      severity: 'error',
      from: { path: '^src/shared/' },
      to: { path: '^src/features/' },
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
    exclude: { path: '[.]test[.]tsx?$' },
    tsConfig: { fileName: 'tsconfig.app.json' },
    tsPreCompilationDeps: true,
  },
};
