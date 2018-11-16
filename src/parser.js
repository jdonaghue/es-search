import { parse } from '@babel/parser';

export default function(code, parserOptions, loose) {
  if (loose) {
    code = code.replace(/\*\*\*/g, '_esSearchRest_');
    while(/(<)\*(\s+)/g.test(code)) {
      code = code.replace(/(<)\*(\s*)/g, '$1_esSearch_$2');
    }
    while(/(<\/)\*/g.test(code)) {
      code = code.replace(/(<\/)\*/g, '$1_esSearch_');
    }
    while(/(<[^>]+\s+)\*([^>]*)/g.test(code)) {
      code = code.replace(/(<[^>*]+\s+)\*([^>]*)/g, '$1_esSearch_$2');
    }
    code = code.replace(/(class|function)(\s+)\*/g, '$1$2_esSearch_');
    code = code.replace(/(let|const|var)(\s+)\*;?$/g, '$1$2_esSearch_ = _esSearch_');
    code = code.replace(/(let|const|var)(\s+)\*/g, '$1$2_esSearch_');
    code = code.replace(/(=\s+)\*/g, '$1_esSearch_');
    code = code.replace(/(\(\s*\))+\*/g, '$1_esSearch_');
    code = code.replace(/\*(\s*\))/g, '_esSearch_$1');
    code = code.replace(/(,\s*)\*(\s*,)/g, '$1_esSearch_$2');
    code = code.replace(/(^\s+)\*(\s+)/g, '$1_esSearch_$2');
    code = code.replace(/(&&|\|\|)(\s*)\*/g, '$1$2_esSearch_');
    code = code.replace(/\*(\s*)(\|\||&&)/g, '_esSearch_$1$2');
    code = code.replace(/(>\s*)\*\*\*/g, '$1{"_esSearchRest_"}');
    code = code.replace(/\*\*\*(\s*<)/g, '{"_esSearchRest_"}$1');
    code = code.replace(/(>\s*)\*/g, '$1{"_esSearch_"}');
    code = code.replace(/\*(\s*<)/g, '{"_esSearch_"}$1');
  }

  return parse(code, parserOptions);
}
