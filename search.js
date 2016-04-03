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

		if (query.type === 'combinator') {
			currentCombinator = query.value;
		}
		else {
			query.estree.forEach(function (estree) {
				options[estree] = function (contextNode, node) {
					matches = matcher(node, query);
					if (matches) {
						if (inMatchingMode) {
							results = results.concat(matches);
						}
					}
					else if (!inMatchingMode) {
						if (checkPosition(currentCombinator, node, contextNode)) {
							var index = results.indexOf(contextNode);
							results.splice(index, 1);
						}
					}
				};
			});
		}

		if (!currentCombinator) {
			var localOptions = {};
			for (var estree in options) {
				localOptions[estree] = options[estree].bind(null, null);
			}
			walk.simple(fileAst, localOptions);
		}
		else if (query.type !== 'combinator') {
			inMatchingMode = false;
			results.forEach(function (node, index) {
				var localOptions = {};
				for (var estree in options) {
					localOptions[estree] = options[estree].bind(null, node);
				}
				walk.simple(fileAst, localOptions);
			}, null, []);
		}
		query = query.parent;
	}

	return results;
}

function checkPosition(combinator, node, contextNode) {
	return walker[combinator](node, contextNode);
}

var walker = {
	descendant: function (node, contextNode) {
		var options = {}
		var found = false;
		options[contextNode.type] = function (node) {
			if (node === contextNode) {
				found = true;
			}
		}
		walk.simple(node, options);
		return found;
	}
};
