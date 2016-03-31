{
	function normalizeParams(params) {
		return params && params.length === 3 ?
			params[1].join('').replace(/\s/g, '').split(',') : null;
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

		var state = {};
		var additive = rep.reverse().reduce(function (top, rhs) {
			if (rhs[1]) {
				rhs[2].inverse = true;
			}
			rhs[2].parent = { type: 'combinator', value: rhs[0] };

			if (top === state) {
				top = rhs[2];
			}
			else {
				var lastParent = findLastParent(top);
				lastParent.parent = rhs[2];
			}

			return top;
		}, state);

		if (additive) {
			findLastParent(additive).parent = type;
		}
		return additive || type;
	}

selectorType
	= wildcard / functionDef / functionRef / arrowFunction / regularExp
	/ instanceMethod / variable / stringLiteral

wildcard
	= star:"*" { return { type: 'wildcard', value: star }; }

functionDef
	= "fndef:" name:identifier+ params:("(" parameters* ")")? {
		return {
			type: 'fndef',
			name: name.join(''),
			params: normalizeParams(params)
		};
	}

functionRef
	= "fn:" name:identifier+ params:("(" parameters* ")")? {
		return {
			type: 'fnref',
			name: name.join(''),
			params: normalizeParams(params)
		};
	}

arrowFunction
	= "(" params:parameters* ")" {
		return {
			type: 'arrowfn',
			params: normalizeParams(params)
		};
	}

regularExp
	= "re:/" reg:[a-zA-Z.*+?><()\^$!]+ "/" indicator:[igm]? {
		return {
			type: 'regexp',
			value: '/' + reg.join('') + '/' + (indicator || '')
		};
	}

stringLiteral
	= "/" reg:[a-zA-Z.*+?><()\^$!]+ "/" indicator:[igm]? {
		return {
			type: 'string',
			value: new RegExp(reg.join(''), indicator)
		};
	}

instanceMethod
	= instance:identifier+ [#]+ method:identifier+ params:("(" parameters* ")")? {
		return {
			type: 'instancemethod',
			instance: instance.join(''),
			method: method.join(''),
			params: normalizeParams(params)
		};
	}

variableType
	= "var"
	/ "const"
	/ "let"

variable
	= definitionType:(variableType ":")? name:identifier+ {
		return {
			type: 'variable',
			value: name.join(''),
			definitionType: definitionType ? definitionType.join('') : null
		};
	}

parameters
	= [a-zA-Z"'*?,= ]

identifier
	= [a-zA-Z$*]