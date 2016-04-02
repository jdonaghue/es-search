var walk = require('./node_modules/acorn/dist/walk');
var verifier = require('./verifier');

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
		var verified = [];

		if (query.type === 'combinator') {
			currentCombinator = query.value;
		}
		else {
			options[query.estree] = function (node) {
				if (verifier(node, query)) {
					verified.push(node);
				}
			};
		}

		if (!currentCombinator) {
			walk.simple(fileAst, options);
			results = verified;
		}
		else if (query.type !== 'combinator') {
			if (currentCombinator === 'descendant') {
				results.forEach(function (node) {
					walk.ancestor(node, options);
				});
			}
			// TODO: handle sibling searches here
			results = verified;
		}
		query = query.parent;
	}

	return results;
}
