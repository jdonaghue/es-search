start
	= space sels:selectors space { return sels.length === 1 ? sels[0] : { type: 'groups', selectors: sels }; }
	/ space { return void 0; }

space
	= " "*

combinator
	= space "+" space { return 'siblingRight'; }
	/ space "~" space { return 'siblingLeft'; }
	/ space ">+" space { return 'immediateSiblingRight'; }
	/ space ">~" space { return 'immediateSiblingLeft'; }

selectors
	= sel:selector groups:(space "," space selector)* {
		return [sel].concat(groups.map(function (group) { return group[3]}));
	}

selector
	= inverse:"!"? type:selectorType ops:(combinator inverse:"!"? selectorType)* {
		if (inverse) {
			type.inverse = true;
		}

		return ops.reduce(function (aggregate, rhs) {
			if (rhs.length === 3) {
				rhs[rhs.length - 1].inverse = true;
			}

			return { type: rhs[0], left: aggregate, right: rhs[rhs.length - 1] };
	    }, type);
	}

selectorType
	= wildcard / variable / functionDef / functionRef / arrowFunction / regularExp
	/ stringLiteral / instanceMethod

wildcard
	= star:"*" { return { type: 'wildcard', value: star }; }

functionDef
	= "fndef:" name:identifier? ("(" params:parameters* ")")? {
		return {
			type: 'fndef',
			name: name ? name.join('') : null,
			params: params ? params.join('').split(',') : null
		};
	}

functionRef
	= "fn:" name:identifier? ("(" params:parameters* ")")? {
		return {
			type: 'fnref',
			name: name ? name.join('') : null,
			params: params ? params.join('').split(',') : null
		};
	}

arrowFunction
	= "(" params:parameters* ")" {
		return {
			type: 'arrowfn',
			params: params ? params.join('').split(',') : null
		};
	}

regularExp
	= ("/" reg:[a-zA-Z.*?><()\^$]+ "/" indicator:[igm]?) {
		return {
			type: 'regexp',
			value: new RegExp(reg.join(''), indicator)
		};
	}

stringLiteral
	= ["']+ literal:[a-zA-Z.*?><|()\^$\\;:-_=+*&%$#@!`~\/]* ["'']+ {
		return {
			type: 'string',
			value: literal ? literal.join('') : null
		};
	}

instanceMethod
	= instance:identifier+ [#]+ method:identifier ("(" params:parameters* ")")? {
		return {
			type: 'instancemethod',
			instance: instance.join(''),
			method: method.join(''),
			params: params ? params.join('').split(',') : null
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
			value: name.join(''),
			definitionType: definitionType
		};
	}

parameters
	= [a-zA-Z"'*?,= ]

identifier
	= [a-zA-Z$]