export default {
  sourceType: "unambiguous",
  allowImportExportEverywhere: true,
  allowReturnOutsideFunction: true,
  allowSuperOutsideMethod: true,
  ranges: true,
  tokens: true,
  plugins: [
    ["flow", { all: true }],
    "jsx",
    "estree",
    "asyncFunctions",
    "asyncGenerators",
    "classConstructorCall",
    "classProperties",
    ["decorators", { decoratorsBeforeExport: false }],
    "doExpressions",
    "exponentiationOperator",
    "exportDefaultFrom",
    "exportNamespaceFrom",
    "functionBind",
    "functionSent",
    "objectRestSpread",
    "trailingFunctionCommas",
    "dynamicImport",
    "numericSeparator",
    "optionalChaining",
    "importMeta",
    "classPrivateProperties",
    "bigInt",
    "optionalCatchBinding",
    "throwExpressions",
    ["pipelineOperator", { proposal: "minimal" }],
    "nullishCoalescingOperator",
    "logicalAssignment",
  ],
};
