{
	function normalizeParams(params) {
		return params && params.length === 3 ?
			params[1].join('').replace(/\s/g, '').split(',') : null;
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

		return rep.reduce(function (aggregate, rhs) {
			var result = { type: rhs[0], left: aggregate, right: rhs[2] };
			if (rhs[1]) {
				result.inverse = true;
			}
			return result;
	    }, type);
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
	= "re:" "/" reg:[a-zA-Z.*+?><()\^$!]+ "/" indicator:[igm]? {
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