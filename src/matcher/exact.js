import _ from 'lodash';
import traverse from '@babel/traverse';

import { reducer } from '../utils';

export default function(queryAstNode, esToSearchAst) {
  if (queryAstNode.type === 'ExpressionStatement') {
    queryAstNode = queryAstNode.expression;
  }

  const results = [];
  const queryClone = reducer(queryAstNode);
  let foundMatch;

  traverse(esToSearchAst, {
    enter(path) {
      if (foundMatch) {
        return;
      }

      if (queryClone.type === path.node.type) {
        const nodeClone = reducer(path.node);

        if (_.isEqual(queryClone, nodeClone) && !results.includes(path.parent)) {
          results.push(path.node);
          foundMatch = path.node;
        }
      }
    },
    exit(path) {
      if (foundMatch === path.node) {
        foundMatch = null;
      }
    }
  });

  return results;
}
