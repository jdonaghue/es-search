start
	= space sels:selectors space { return sels.length === 1 ? sels[0] : { type: 'groups', selectors: sels }; }
	/ space { return void 0; }

space
	= " "*

combinator
	= space ">" space { return 'descendant' }
	/ space "+" space { return 'siblingRight'; }
	/ space "~" space { return 'siblingLeft'; }
	/ space ">+" space { return 'immediateSiblingRight'; }
	/ space ">~" space { return 'immediateSiblingLeft'; }

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
			if (rhs.length === 3) {
				rhs[rhs.length - 1].inverse = true;
			}

			return { type: rhs[0], left: aggregate, right: rhs[rhs.length - 1] };
	    }, type);
	}

selectorType
	= wildcard / functionDef / functionRef / arrowFunction / regularExp
	/ stringLiteral / instanceMethod / variable

wildcard
	= star:"*" { return { type: 'wildcard', value: star }; }

functionDef
	= "fndef:" name:identifier+ params:("(" parameters* ")")? {
		return {
			type: 'fndef',
			name: name.join(''),
			params: params && params.length === 3 ? params[1].join('').split(',') : null
		};
	}

functionRef
	= "fn:" name:identifier+ params:("(" parameters* ")")? {
		return {
			type: 'fnref',
			name: name.join(''),
			params: params && params.length === 3 ? params[1].join('').split(',') : null
		};
	}

arrowFunction
	= "(" params:parameters* ")" {
		return {
			type: 'arrowfn',
			params: params ? params.split(',') : null
		};
	}

regularExp
	= "/" reg:[a-zA-Z.*?><()\^$]+ "/" indicator:[igm]? {
		return {
			type: 'regexp',
			value: new RegExp(reg.join(''), indicator)
		};
	}

stringLiteral
	= ["']+ literal:[a-zA-Z.*?><|()\^$\\;:-_=+*&%$#@!`~\/]* ["'']+ {
		return {
			type: 'string',
			value: literal
		};
	}

instanceMethod
	= instance:identifier+ [#]+ method:identifier+ params:("(" parameters* ")")? {
		return {
			type: 'instancemethod',
			instance: instance.join(''),
			method: method.join(''),
			params: params && params.length === 3 ? params[1].join('').split(',') : null
		};
	}

variableType
	= "var"
	/ "const"
	/ "let"

variable
	= definitionType:(variableType ":")? name:identifier {
		return {
			type: 'variable',
			value: name,
			definitionType: definitionType
		};
	}

parameters
	= [a-zA-Z"'*?,= ]

identifier
	= [a-zA-Z$*]