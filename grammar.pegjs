{
	function normalizeParams(params) {
		return params && params.length === 3 ?
			params[1].filter(function (param) {
			 	return param !== ',' && param !== ' ';
		 	}) : null;
	}
	function normalizeIdentifier(identifier) {
		return identifier ? identifier.reverse().reduce(function (top, next) {
			return (next[1] ? next.join('') : next[0]) + top
		}, '') : null;
	}
	function findLastParent(parent) {
		if (parent && parent.parent) {
			return findLastParent(parent.parent);
		}
		return parent;
	}
}

start
	= space sels:selectors space { return sels.length === 1 ? sels[0] : { type: 'groups', selectors: sels }; }
	/ space { return void 0; }

space
	= " "*

combinator
	= space ">+" space { return 'immediateSiblingRight'; }
	/ space ">~" space { return 'immediateSiblingLeft'; }
	/ space ">" space { return 'descendant' }
	/ space "<" space { return 'ancestor' }
	/ space "+" space { return 'siblingRight'; }
	/ space "~" space { return 'siblingLeft'; }

selectors
	= sel:selector groups:(space "," space selector)* {
		return [sel].concat(groups.map(function (group) { return group[3] }));
	}

selector
	= inverse:"!"? type:selectorType rep:(combinator "!"? selectorType)* {
		if (inverse) {
			type.inverse = true;
		}

		var empty = {};
		var tree = rep.reverse().reduce(function (top, rhs) {
			if (rhs[1]) {
				rhs[2].inverse = true;
			}
			rhs[2].parent = { type: 'combinator', value: rhs[0] };

			if (top === empty) {
				top = rhs[2];
			}
			else {
				var lastParent = findLastParent(top);
				lastParent.parent = rhs[2];
			}

			return top;
		}, empty);

		if (tree.type) {
			findLastParent(tree).parent = type;
		}
		else {
			tree = type;
		}
		return tree || type;
	}

selectorType
	= wildcard / functionDef / functionRef / arrowFunction / regularExp
	/ instanceMethod / variable / stringLiteral / literal

wildcard
	= star:"*" {
		return {
			type: 'wildcard', 
			estree: [
				'CallExpression',
				'Expression',
				'Function',
				'Statement',
				'VariableDeclarator',
				'Property'
			],
			value: star
		};
	}

functionDef
	= "fndef:" name:identifier* params:("(" [.a-zA-Z$,?* ]* ")")? {
		return {
			type: 'fndef',
			estree: [ 'Function' ],
			name: normalizeIdentifier(name),
			params: params ? params[1].join('').replace(/\s+/, '').split(',') : null
		};
	}

functionRef
	= "fn:" name:identifier* params:("(" parameters* ")")? {
		return {
			type: 'fnref',
			estree: [ 'CallExpression' ],
			name: normalizeIdentifier(name),
			params: normalizeParams(params)
		};
	}

arrowFunction
	= params:("(" parameters* ")") {
		return {
			type: 'arrowfn',
			estree: [ 'ArrowFunctionExpression' ],
			params: normalizeParams(params)
		};
	}

regularExp
	= "re:/" reg:[a-zA-Z.*+?><()\^\\$!:]+ "/" indicator:[igm]? {
		return {
			type: 'regex',
			estree: [ 'ExpressionStatement', 'VariableDeclarator' ],
			value: '/' + reg.join('') + '/' + (indicator || '')
		};
	}

stringLiteral
	= "/" reg:[a-zA-Z.*+?><()\^\\$!:_\-]+ "/" indicator:[igm]? {
		return {
			type: 'stringliteral',
			estree: [ 'Literal' ],
			value: indicator ? new RegExp(reg.join(''), indicator) : new RegExp(reg.join(''))
		};
	}

literals
	= [0-9]+
	/ "true"
	/ "false"

literal
	= lit:literals {
		return {
			type: 'literal',
			estree: [ 'Literal' ],
			value: lit.join ? lit.join('') : lit
		};
	}

instanceMethod
	= instance:identifier+ [.] method:identifier+ params:("(" parameters* ")")? {
		return {
			type: 'instancedereference',
			estree: [ 'CallExpression', 'MemberExpression' ],
			instance: normalizeIdentifier(instance),
			methodOrProperty: normalizeIdentifier(method),
			params: normalizeParams(params)
		};
	}

variableDeclarationType
	= "window"
	/ "var"
	/ "const"
	/ "let"

variable
	= definitionType:(variableDeclarationType ":")? name:identifier+ assignment:("=" selectorType)? {
		return {
			type: 'variable',
			estree: [ 'VariableDeclaration', 'AssignmentExpression' ],
			value: normalizeIdentifier(name),
			definitionType: definitionType ? definitionType[0] : null,
			assignment: assignment ? assignment[1] : null
		};
	}

parameters
	= selectorType
	/ [a-zA-Z"'*?,=\[\]{}. ]

identifier
	= [a-zA-Z$*_][0-9]?