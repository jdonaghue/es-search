import exact from './matcher/exact';
import loose from './matcher/loose';

export default function search(queryAst, esToSearchAst, options = {}) {
  let results = [];
  const matcher = options.exact ? exact : loose;

  queryAst.program.body.forEach(topLevelQueryAst => {
    results = results.concat(matcher(topLevelQueryAst, esToSearchAst));
  });

  return results;
};
