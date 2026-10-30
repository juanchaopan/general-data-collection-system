// 公式引擎（ADR-0001）：基于 fast-formula-parser、@formulajs/formulajs 和自建依赖图。
// 本包必须能在 Node 和浏览器里运行：tsconfig 不引入 Node 类型，用到 Node 专有接口会编译不过。

/** 取出公式里引用的单元格地址（例如 "A1+B2" → ["A1","B2"]）。依赖图的最小起点。 */
export function referencedCells(formula: string): string[] {
  const matches = formula.match(/\$?[A-Z]{1,3}\$?[0-9]+/g) ?? [];
  return [...new Set(matches.map((m) => m.replaceAll('$', '')))];
}
