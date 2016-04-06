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

	function normalizeRegExFlags(flags) {
		return flags ? flags.join('') : null;
	}

	function normalizeDereference(dereference) {
		return dereference.map(function (deref) {
			if (deref[0] === '[' && deref[2] === ']') {
				return deref[1];
			}
			else if (deref[0].type === 'wildcard') {
				return deref[0];
			}
			else {
				return normalizeIdentifier(deref[0]);
			}
		});
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

spaceReq
	= " "

space
	= " "*

combinator
	= spaceReq ">+" spaceReq { return 'immediateSiblingRight'; }
	/ spaceReq ">~" spaceReq { return 'immediateSiblingLeft'; }
	/ spaceReq ">" spaceReq { return 'descendant' }
	/ spaceReq "<" spaceReq { return 'ancestor' }
	/ spaceReq "+" spaceReq { return 'siblingRight'; }
	/ spaceReq "~" spaceReq { return 'siblingLeft'; }

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
	= ifStatement / whileLoop / condition / functionDef / functionRef / arrowFunction / instanceMethod
	/ regularExp / variable / stringLiteral / literal / wildcard

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
	= "re:/" reg:[a-zA-Z.*+?><()\^\$!:;_\-\[\]0-9=&#`~]+ "/" indicator:[igm]* {
		return {
			type: 'regex',
			estree: [ 'ExpressionStatement', 'VariableDeclarator', 'MemberExpression' ],
			value: '/' + reg.join('') + '/' + (normalizeRegExFlags(indicator) || '')
		};
	}

stringLiteral
	= "/" reg:[a-zA-Z.*+?><()\^\$!:;_\-\[\]0-9=&#`~]+ "/" indicator:[igm]* {
		return {
			type: 'stringliteral',
			estree: [ 'Literal' ],
			value: indicator ? new RegExp(reg.join(''), normalizeRegExFlags(indicator)) : new RegExp(reg.join(''))
		};
	}
	/ "'" str:[a-zA-Z.*+?><()\^\$!:;_\-\[\]0-9=&#`~]+ "'" {
		return {
			type: 'stringliteral',
			estree: [ 'Literal' ],
			value: new RegExp(str.join(''))
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

operator
	= "==="
	/ "=="
	/ "!=="
	/ "!="
	/ ">=="
	/ ">="
	/ ">"
	/ "<=="
	/ "<="
	/ "<"

binaryExpressionPart
	= functionRef
	/ regularExp
	/ stringLiteral
	/ arrowFunction
	/ variable
	/ literal
	/ wildcard

binaryExpression
	= instanceMethod
	/ lhs:binaryExpressionPart rhs:(operator binaryExpressionPart)? {
		return rhs && rhs[0] ? {
			type: 'binaryexpression',
			estree: [ 'BinaryExpression' ],
			operator: rhs ? rhs[0] : null,
			left: lhs,
			right: rhs ? rhs[1] : null
		} : lhs;
	}

dereferencePart
	= "[" stringLiteral "]" [.]?
	/ identifier+ [.]?
	/ wildcard [.]?

instanceMethod
	= instance:binaryExpressionPart [.]? deref:dereferencePart+ params:("(" parameters* ")")? {
		return {
			type: 'instancedereference',
			estree: [ 'CallExpression', 'MemberExpression' ],
			instance: instance,
			methodOrProperty: normalizeDereference(deref),
			params: normalizeParams(params)
		};
	}

ternary
	= binaryExpression "?" ":" 

joinOperator
	= "&&"
	/ "||"

conditionExpression
	= "*" cond:conditionExpression {
		return {
			type: 'anycondition',
			estree: [ 'LogicalExpression' ],
			condition: cond
		}
	}
	/ "(" left:conditionExpression ")" right:(joinOperator conditionExpression)? {
		return right && right[0] ? {
			type: 'logicalexpression',
			estree: [ 'LogicalExpression' ],
			operator: right ? right[0] : null,
			left: left,
			right: right ? right[1] : null
		} : left;
	}
	/ left:binaryExpression right:(joinOperator binaryExpression)? {
		return right && right[0] ? {
			type: 'logicalexpression',
			estree: [ 'LogicalExpression' ],
			operator: right ? right[0] : null,
			left: left,
			right: right ? right[1] : null
		} : left;
	}
	/ binaryExpression

condition
	= "cond:" cond:conditionExpression {
		return cond;
	}

ifStatement
	= "if:" cond:conditionExpression {
		return {
			type: 'ifstatement',
			estree: [ 'IfStatement' ],
			condition: cond
		}
	}

whileLoop
	= "while:" cond:conditionExpression {
		return {
			type: 'whileloop',
			estree: [ 'WhileStatement' ],
			condition: cond
		}
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
	= [a-zA-Z$_][*0-9]?