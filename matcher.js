var parser = require('./parser');

module.exports = function (sourceNode, queryNode) {
	if (!queryNode || !queryNode.type) {
		return false;
	}

	switch (queryNode.type) {
		case 'fndef': {
			if (((sourceNode.id && sourceNode.id.type === 'Identifier' &&
				logic.identifier(sourceNode.id.name, queryNode.name)) ||
				(!sourceNode.id && !queryNode.name &&
					sourceNode.type !== 'ArrowFunctionExpression')) &&
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
			if (sourceNode.type === 'ArrowFunctionExpression' &&
				logic.parameters(sourceNode.params, queryNode.params)) {

				return [ sourceNode ];
			}
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
					var toTest = sourceNode.expression.arguments.map(function (arg, index) {
						return index === 0 ? '/' + arg.value + '/' : arg.value;
					}).join('');

					if (logic.regex(toTest, queryNode.value)) {
						return [ sourceNode ];
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
			else if (sourceNode.init) {
				if (sourceNode.init.type === 'NewExpression' &&
					sourceNode.init.callee.name === 'RegExp') {
					var toTest = sourceNode.init.arguments.map(function (arg, index) {
						return index === 0 ? '/' + arg.value + '/' : arg.value;
					}).join('');

					if (logic.regex(toTest, queryNode.value)) {
						return [ sourceNode.init ];
					}
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

		case 'instancedereference': {
			var searchNode = sourceNode.callee || sourceNode;
			if (searchNode && searchNode.object && searchNode.property &&
				(logic.identifier(searchNode.object.name, queryNode.instance)) &&
				(logic.identifier(searchNode.property.name, queryNode.methodOrProperty)) &&
				logic.parameters(sourceNode.arguments, queryNode.params)) {

				return [ sourceNode ];
			}
			break;
		}

		case 'variable': {
			if (!queryNode.definitionType ||
				(queryNode.definitionType === 'window' && !sourceNode.kind) ||
				(queryNode.definitionType === sourceNode.kind)) {

				if (sourceNode.declarations) {
					var node = sourceNode.declarations.find(function (node) {
						return node.id && logic.variable(node.id, queryNode.value);
					});

					if (node) {
						if (queryNode.assignment) {
							if (node.init && module.exports(node.init, queryNode.assignment)) {
								return [ sourceNode ];
							}
						}
						else {
							return [ node ];
						}
					}
				}
				else if (sourceNode.type === 'Identifier' && logic.variable(sourceNode, queryNode.value)) {
					return [ sourceNode ];
				}
				else if (sourceNode.type === 'AssignmentExpression') {
					if (queryNode.assignment) {
						if (sourceNode.left && logic.variable(sourceNode.left, queryNode.value)) {
							if (module.exports(sourceNode.right, queryNode.assignment)) {
								return [ sourceNode ];
							}
						}
					}
					else if (logic.variable(sourceNode.left, queryNode.value)) {
						return [ sourceNode ];
					}
				}
			}
			break;
		}

		case 'wildcard': {
			return [ sourceNode ];
		}

		case 'literal': {
			if (logic.literal(sourceNode.value, queryNode.value)) {
				return [ sourceNode ];
			}
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

	literal: function (toTest, tester) {
		return tester == toTest;
	},

	parameters: function (args, parameters) {
		function isWildcard(parameter) {
			return parameter && (parameter === '*' || parameter.value === '*');
		}
		var match = true;
		if (parameters && args) {
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
		else if (parameters && !args) {
			match = false;
		}
		return match;
	}
};

function a(reg, b) {

}

a(/test/g, /test/g, a);

var b = new RegExp('test', 'g');

new RegExp('test', 'g');

var c = (a, b) => {
	return 1;
}

var d = function (a, b) {
	return 1;
}

b.test('blah');

test = 1;
