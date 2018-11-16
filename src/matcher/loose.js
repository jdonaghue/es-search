import _ from 'lodash';
import traverse from '@babel/traverse';

import { reducer } from '../utils';

function isSingleWildcard(node) {
  return node.name === '_esSearch_'
    || (node.type === 'ExpressionStatement'
      && node.expression.name === '_esSearch_')
      || (node.type === 'JSXAttribute'
        && node.name.name === '_esSearch_')
        || (node.type === 'JSXText'
          && node.raw === '_esSearch_')
          || (node.type === 'JSXIdentifier'
            && node.name === '_esSearch_')
            || (node.type === 'JSXExpressionContainer'
              && node.expression.value === '_esSearch_');
}

function isSpreadWildcard(node) {
  return node.name === '_esSearchRest_'
    || (node.type === 'ExpressionStatement'
      && node.expression.name === '_esSearchRest_')
      || (node.type === 'JSXText'
        && node.raw === '_esSearchRest_')
        || (node.type === 'JSXAttribute'
          && node.name.name === '_esSearchRest_')
          || (node.type === 'JSXIdentifier'
            && node.name === '_esSearchRest_')
            || (node.type === 'JSXExpressionContainer'
              && node.expression.value === '_esSearchRest_');
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

function checkForTestNodes(queryAst, toSearchAst) {
  if (queryAst.test && toSearchAst.test) {
    const queryFlattended = flattenTestNode(queryAst.test);
    const toSearchFlattened = flattenTestNode(toSearchAst.test);
    let shortCircuit = false;
    let mustMatch = false;

    const all = toSearchFlattened.every((node, index) => {
      const queryNode = queryFlattended[index] || {};
      if (isSingleWildcard(queryNode)) {
        return true;
      }
      if (isSpreadWildcard(queryNode)) {
        shortCircuit = true;
      } else if (shortCircuit || mustMatch) {
        mustMatch = true;
        shortCircuit = false;
        if (_.isEqual(queryNode, node)) {
          mustMatch = false;
        }
        return true;
      }
      return shortCircuit || _.isEqual(queryNode, node);
    });

    if (all && !mustMatch) {
      return true;
    }
    return false;
  }
}

function checkForAttributeNodes(queryAst, toSearchAst) {
  if (queryAst.attributes && queryAst.attributes.length
    && toSearchAst.attributes && toSearchAst.attributes.length) {
    let shortCircuit = false;
    let mustMatch = false;
    let containsWildcard = false;

    const all = toSearchAst.attributes.every((node, index) => {
      const queryNode = queryAst.attributes[index] || {};
      if (isSingleWildcard(queryNode)) {
        return true;
      }
      if (isSpreadWildcard(queryNode)) {
        shortCircuit = true;
        containsWildcard = true;
      } else if (shortCircuit || mustMatch) {
        mustMatch = true;
        shortCircuit = false;
        if (performTreeEqualityTests(queryNode, node)) {
          mustMatch = false;
        }
        return true;
      }
      return shortCircuit || performTreeEqualityTests(queryNode, node);
    });

    if (all && !mustMatch) {
      if (queryAst.attributes.length !== toSearchAst.attributes.length) {
        return containsWildcard;
      }
      return true;
    }
    return false;
  }
}

function checkForChildrenNodes(queryAst, toSearchAst) {
  if (queryAst.children && queryAst.children.length
    && toSearchAst.children && toSearchAst.children.length) {
    let shortCircuit = false;
    let mustMatch = false;
    let containsWildcard = false;

    // only text nodes of substance
    const queryChildren = queryAst.children.filter(
      node => node.type !== 'JSXText' || node.value.trim()
    );
    const toSearchChildren = toSearchAst.children.filter(
      node => node.type !== 'JSXText' || node.value.trim()
    );

    const all = toSearchChildren.every((node, index) => {
      const queryNode = queryChildren[index] || {};
      if (isSingleWildcard(queryNode)) {
        return true;
      }
      if (isSpreadWildcard(queryNode)) {
        shortCircuit = true;
        containsWildcard = true;
      } else if (shortCircuit || mustMatch) {
        mustMatch = true;
        shortCircuit = false;
        if (performTreeEqualityTests(queryNode, node)) {
          mustMatch = false;
        }
        return true;
      }
      return shortCircuit || performTreeEqualityTests(queryNode, node);
    });

    if (all && !mustMatch) {
      if (queryChildren.length !== toSearchChildren.length) {
        return containsWildcard;
      }
      return true;
    }
    return false;
  }
}

function performTreeEqualityTests(queryAst, toSearchAst) {
  if (isSingleWildcard(queryAst)) {
    return true;
  }

  if (!toSearchAst) {
    return false;
  }

  // check condition expressions
  const testNodeCheck = checkForTestNodes(queryAst, toSearchAst);
  if (testNodeCheck) {
    return true;
  } else if (testNodeCheck === false) {
    return false;
  }

  // check for JSX attributes
  const attributeNodesCheck = checkForAttributeNodes(queryAst, toSearchAst);
  if (attributeNodesCheck) {
    return true;
  } else if (attributeNodesCheck === false) {
    return false;
  }

  // check for JSX children
  const childrenNodesCheck = checkForChildrenNodes(queryAst, toSearchAst);
  if (childrenNodesCheck) {
    return true;
  } else if (childrenNodesCheck === false) {
    return false;
  }

  // consult the entire object graph
  return Object.keys(queryAst).reduce((truth, property) => {
    if (!truth) {
      return false;
    }

    if (Array.isArray(queryAst[property])) {
      let shortCircuit = false;
      return !queryAst[property].length
        || queryAst[property].every((node, index) => {
          if (isSingleWildcard(node)) {
            return true;
          }
          if (isSpreadWildcard(node)) {
            shortCircuit = true;
          }
          return shortCircuit
            || performTreeEqualityTests(node, toSearchAst[property][index])
        });
    } else if (_.isObject(queryAst[property])) {
      if (isSingleWildcard(queryAst[property])) {
        toSearchAst[property] = queryAst[property];
        return true;
      }
      return performTreeEqualityTests(
        queryAst[property], toSearchAst[property]);
    }

    return (property in toSearchAst)
      && queryAst[property] == toSearchAst[property];
  }, true);
}

export default function(queryAstNode, esToSearchAst) {
  const results = [];
  let queryClone = reducer(queryAstNode);

  if (queryClone.type === 'ExpressionStatement'
    && queryClone.name !== '_esSearch_') {
    queryClone = queryClone.expression;
  }

  traverse(esToSearchAst, {
    enter(path) {
      if (queryClone.type === path.node.type) {
        const nodeClone = reducer(path.node);

        if (performTreeEqualityTests(queryClone, nodeClone)) {
          results.push(path.node);
        }
      }
    },
  });

  return results;
}
