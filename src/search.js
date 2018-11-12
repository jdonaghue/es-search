import traverse from '@babel/traverse';
import matcher from './matcher';

const walker = {
  descendant(rootNode, contextNode) {
    const finders = [];
    let found = false;
    
    finders.push(function (node) {
      if (node === contextNode) {
        found = true;
      }
    });
    finders.push(function (node) {
      if (node === contextNode) {
        found = true;
      }
    });

    traverse(rootNode, {
      enter(path) {
        finders.forEach(finder => (
          finder(path.node)
        ));
      }
    });
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
    const estreeMatchers = {};
    let parentNodes = [];

    if (query.type === 'combinator') {
      currentCombinator = query.value;
    } else {
      query.estree.forEach(function (estree) {
        estreeMatchers[estree] = function (node) {
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
      traverse(fileAst, {
        enter(path) {
          Object.keys(estreeMatchers).forEach(type => (
            estreeMatchers[type](path.node)
          ));
        }
      });
    } else if (query.type !== 'combinator') {
      inMatchingMode = false;
      traverse(fileAst, {
        enter(path) {
          Object.keys(estreeMatchers).forEach(type => (
            estreeMatchers[type](path.node)
          ));
        }
      });

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

export default function search(queryAst, fileAst) {
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
