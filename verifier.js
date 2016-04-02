module.exports = function (sourceNode, queryNode) {
	switch (queryNode.type) {
		case 'fndef': {
			if (sourceNode.id && sourceNode.id.type === 'Identifier' &&
				verifier.identifier(sourceNode.id.name, queryNode.name)) {

				return verifier.parameters(sourceNode.params, queryNode.params);
			}
			break;
		}

		case 'fnref': {
			if (sourceNode.callee.type === 'Identifier' &&
				verifier.identifier(sourceNode.callee.name, queryNode.name)) {

				return verifier.parameters(sourceNode.arguments, queryNode.params);
			}
			break;
		}
	}

	return false;
};

verifier = {
	stringliteral: function (toTest, tester) {
		return tester.test(toTest.name);
	},

	regexp: function (toTest, tester) {
		return tester === toTest.raw;
	},

	identifier: function (toTest, tester) {
		return tester === '*' || tester === toTest;
	},

	variable: function (toTest, tester) {
		return toTest.type === 'Identifier' && tester === toTest.name;
	},

	parameters: function (args, parameters) {
		var match = true;
		if (parameters) {
			parameters.forEach(function (param, index) {
				if (match) {
					match = verifier[param.type](args[index], param.value);
				}
			});
		}
		return match;
	}
};
