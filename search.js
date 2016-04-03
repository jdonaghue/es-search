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

	while (query) {
		var options = {};
		var matched = [];

		if (query.type === 'combinator') {
			currentCombinator = query.value;
		}
		else {
			query.estree.forEach(function (estree) {
				options[estree] = function (node) {
					matches = matcher(node, query);
					if (matches) {
						matched = matched.concat(matches);
					}
				};
			});
		}

		if (!currentCombinator) {
			walk.simple(fileAst, options);
			results = matched;
		}
		else if (query.type !== 'combinator') {
			if (currentCombinator === 'descendant') {
				results.forEach(function (node) {
					walk.ancestor(node, options);
				});
			}
			// TODO: handle sibling searches here
			results = matched;
		}
		query = query.parent;
	}

	return results;
}
