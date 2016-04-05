var walk = require('./node_modules/acorn/dist/walk');
var matcher = require('./matcher');

module.exports = function (queryAst, fileAst) {
	var results = [];
	var query = queryAst;

	if (query.type === 'groups') {
		query.selectors.forEach(function (selector) {
			results = results.concat(execute(selector, fileAst));
		});
	}
	else {
		results = execute(query, fileAst);
	}

	return results;
};

function execute(query, fileAst) {
	var results = [];
	var currentCombinator;
	var inMatchingMode = true;

	while (query) {
		var options = {};
		var parentNodes = [];

		if (query.type === 'combinator') {
			currentCombinator = query.value;
		}
		else {
			query.estree.forEach(function (estree) {
				options[estree] = function (node) {
					matches = matcher(node, query);
					if (matches) {
						if (inMatchingMode) {
							results = results.concat(matches);
						}
						else {
							parentNodes = parentNodes.concat(matches);
						}
					}
				};
			});
		}

		if (!currentCombinator) {
			walk.simple(fileAst, options);
		}
		else if (query.type !== 'combinator') {
			inMatchingMode = false;
			walk.simple(fileAst, options);
			var prunedList = [];
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
}

function checkPosition(combinator, node, contextNode) {
	return walker[combinator](node, contextNode);
}

var walker = {
	descendant: function (rootNode, contextNode) {
		var options = {}
		var found = false;
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
