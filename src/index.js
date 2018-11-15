import parse from './parser';
import search from './search';
import parseOptions from './parseOptions';
import { unique } from './utils';

export default function(query, esToSearch, options = {}) {
  const queryAst = parse(query, parseOptions, !options.exact);
  const esToSearchAst = parse(esToSearch, parseOptions);

  return {
    found: unique(search(queryAst, esToSearchAst, options)),
    source: esToSearch,
  };
}
