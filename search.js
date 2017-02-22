import walk from './node_modules/acorn/dist/walk';
import matcher from './matcher';

const walker = {
  descendant(rootNode, contextNode) {
    const options = {}
    let found = false;
    options[rootNode.type] = function (node) {
      if (node === contextNode) {
        found = true;
      }
    }
    options[contextNode.type] = function (node) {
      if (node === contextNode) {
        found = true;
      }
    }
    walk.simple(rootNode, options);
    return found;
  }
};

function checkPosition(combinator, node, contextNode) {
  return walker[combinator](node, contextNode);
};

function execute(query, fileAst) {
  let results = [];
  let currentCombinator;
  let inMatchingMode = true;

  while (query) {
    const options = {};
    let parentNodes = [];

    if (query.type === 'combinator') {
      currentCombinator = query.value;
    } else {
      query.estree.forEach(function (estree) {
        options[estree] = function (node) {
          const matches = matcher(node, query);
          if (matches) {
            if (inMatchingMode) {
              results = results.concat(matches);
            } else {
              parentNodes = parentNodes.concat(matches);
            }
          }
        };
      });
    }

    if (!currentCombinator) {
      walk.simple(fileAst, options);
    } else if (query.type !== 'combinator') {
      inMatchingMode = false;
      walk.simple(fileAst, options);

      const prunedList = [];
      results.forEach(function (node) {
        parentNodes.forEach(function (match) {
          if (checkPosition(currentCombinator, match, node)) {
            prunedList.push(node);
          }
        });
      });
      results = prunedList;
    }
    query = query.parent;
  }

  return results;
};

export default function (queryAst, fileAst) {
  let results = [];

  if (queryAst.type === 'groups') {
    queryAst.selectors.forEach(function (selector) {
      results = results.concat(execute(selector, fileAst));
    });
  } else {
    results = execute(queryAst, fileAst);
  }

  return results;
};
