import { parse } from '@babel/parser';

export default function(code, parserOptions, loose) {
  if (loose) {
    code.replace(/class ./g, 'class _esSearch_');
    code.replace(/_\*_/gm, '_esSearch_');
  }

  return parse(code, parserOptions);
}
