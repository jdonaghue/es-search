import _ from 'lodash';
import traverse from '@babel/traverse';

import { reducer } from '../utils';

function isSingleWildcard(node) {
  return node.name === '_esSearch_'
    || (node.type === 'ExpressionStatement'
      && node.expression.name === '_esSearch_');
}

function isSpreadWildcard(node) {
  return node.name === '_esSearchRest_'
    || (node.type === 'ExpressionStatement'
      && node.expression.name === '_esSearchRest_');
}

function flattenTestNode(ast) {
  let flattened = [];

  if (ast.left) {
    flattened = flattened.concat(flattenTestNode(ast.left));
  }

  if (ast.right) {
    flattened = flattened.concat(flattenTestNode(ast.right));
  }

  if (!ast.left) {
    flattened.push(ast);
  }

  return flattened;
}

function searchTreeEquality(queryAst, toSearchAst) {
  if (!toSearchAst) {
    return false;
  }

  if (isSingleWildcard(queryAst)) {
    return true;
  }

  if (queryAst.test && toSearchAst.test) {
    const queryFlattended = flattenTestNode(queryAst.test);
    const toSearchFlattened = flattenTestNode(toSearchAst.test);
    let shortCircuit = false;

    const all = toSearchFlattened.every((node, index) => {
      const queryNode = queryFlattended[index] || {};
      if (isSingleWildcard(queryNode)) {
        shortCircuit = true;
      }
      return shortCircuit || _.isEqual(queryNode, node);
    });

    if (all) {
      return true;
    }
  }

  return Object.keys(queryAst).reduce((truth, property) => {
    if (!truth) {
      return false;
    }

    if (Array.isArray(queryAst[property])) {
      let shortCircuit = false;
      return !queryAst[property].length || queryAst[property].every((node, index) => {
        if (isSpreadWildcard(node)) {
          shortCircuit = true;
        }
        return shortCircuit || searchTreeEquality(node, toSearchAst[property][index])
      });
    } else if (queryAst[property] && typeof queryAst[property] === 'object') {
      if (isSingleWildcard(queryAst[property])) {
        toSearchAst[property] = queryAst[property];
        return true;
      }
      return searchTreeEquality(
        queryAst[property], toSearchAst[property]);
    }

    return (property in toSearchAst) && queryAst[property] == toSearchAst[property];
  }, true);
}

export default function(queryAstNode, esToSearchAst) {
  const results = [];
  let queryClone = reducer(queryAstNode);

  if (queryClone.type === 'ExpressionStatement' && queryClone.name !== '_esSearch_') {
    queryClone = queryClone.expression;
  }

  traverse(esToSearchAst, {
    enter(path) {
      if (queryClone.type === path.node.type) {
        const nodeClone = reducer(path.node);

        if (searchTreeEquality(queryClone, nodeClone)) {
          results.push(path.node);
        }
      }
    },
  });

  return results;
}
