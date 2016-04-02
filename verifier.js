var parser = require('./parser');

module.exports = function (sourceNode, queryNode) {
	if (!queryNode || !queryNode.type) {
		return false;
	}

	switch (queryNode.type) {
		case 'fndef': {
			if (sourceNode.id && sourceNode.id.type === 'Identifier' &&
				logic.identifier(sourceNode.id.name, queryNode.name) &&
				logic.parameters(sourceNode.params, queryNode.params)) {

				return [ sourceNode ];
			}
			break;
		}

		case 'fnref': {
			if (sourceNode.callee.type === 'Identifier' &&
				logic.identifier(sourceNode.callee.name, queryNode.name) &&
				logic.parameters(sourceNode.arguments, queryNode.params)) {

				return [ sourceNode ];
			}
			break;
		}

		case 'arrowfn': {

			break;
		}

		case 'regex': {
			if (sourceNode.expression) {
				if (sourceNode.expression.type === 'Literal') {
					if (sourceNode.expression.regex &&
						logic.regex(sourceNode.expression.raw, queryNode.value)) {
						return [ sourceNode.expression ];
					}
				}
				else if (sourceNode.expression.type === 'NewExpression' &&
					sourceNode.expression.callee.name === 'RegExp') {
					var toTest = sourceNode.expression.callee.arguments.map(function (arg, index) {
						return index === 0 ? '/' + arg.value + '/' : arg.value;
					}).join('');

					if (logic.regex(toTest, queryNode.value)) {
						return [ sourceNode.expression ];
					}
				}
				else if (sourceNode.expression.type === 'CallExpression') {
					var matched = [];
					sourceNode.expression.arguments.forEach(function (arg) {
						var matches = module.exports(arg, queryNode);
						if (matches) {
							matched = matched.concat(matches);
						}
					});
					return matched.length ? matched : null;
				}
			}
			else if (sourceNode.type === 'Literal' && sourceNode.regex) {
				if (logic.regex(sourceNode.raw, queryNode.value)) {
					return [ sourceNode ];
				}
			}
			break;
		}

		case 'stringliteral': {
			if (logic.stringliteral(sourceNode, queryNode.value)) {
				return [ sourceNode ];
			}
			break;
		}

		case 'instancemethod': {

			break;
		}

		case 'variable': {
			if (!queryNode.definitionType ||
				(queryNode.definitionType === '*' && !sourceNode.kind) ||
				(queryNode.definitionType === sourceNode.kind)) {

				if (sourceNode.declarations) {
					var node = sourceNode.declarations.find(function (node) {
						return node.id && logic.variable(node.id, queryNode.value);
					});

					return [ node ];
				}
				else if (logic.variable(sourceNode, queryNode.value)) {
					return [ sourceNode ];
				}
			}
			break;
		}
	}

	return null;
};

var logic = {
	stringliteral: function (toTest, tester) {
		return !toTest.regex && tester.test(toTest.value);
	},

	regex: function (toTest, tester) {
		return tester === toTest;
	},

	identifier: function (toTest, tester) {
		return tester === '*' || tester === toTest;
	},

	variable: function (toTest, tester) {
		return toTest.type === 'Identifier' && tester === toTest.name;
	},

	parameters: function (args, parameters) {
		function isWildcard(parameter) {
			return parameter && (parameter === '*' || parameter.value === '*');
		}
		var match = true;
		if (parameters) {
			var wildcard = parameters.some(function (param) {
				return isWildcard(param);
			});
			var param;
			if (wildcard) {
				wildcard = false;
				var index = 0;
				param = parameters[index];

				args.forEach(function (arg) {
					if (!match) {
						return;
					}

					while (isWildcard(param)) {
						wildcard = isWildcard(param);
						param = parameters[++index];
					}

					if (param && param !== '?') {
						if (typeof param === 'string') {
							param = parser.parse(param);
						}
						match = !!module.exports(arg, param);
						if (match) {
							param = parameters[++index];
							wildcard = false;
						}
						else if (wildcard) {
							match = true;
						}
					}
				});

				for (var i = index, length = parameters.length; match && i < length; i++) {
					if (!isWildcard(parameters[i])) {
						match = false;
					}
				}
			}
			else {
				args.forEach(function (arg, index) {
					param = parameters[index];
					if (!param) {
						match = false;
					}
					if (match && param !== '?') {
						if (typeof param === 'string') {
							param = parser.parse(param);
						}
						match = !!module.exports(arg, param);
					}
				});
			}
		}
		return match;
	}
};

function a(reg, b) {

}

a(/test/g, /test/g, a);
