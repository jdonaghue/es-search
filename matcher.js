import walk from './node_modules/acorn/dist/walk';
import parser from './parser';

const logic = {
  stringliteral(toTest, tester) {
    return !toTest.regex && tester.test(toTest.value);
  },

  regex(toTest, tester) {
    return tester === toTest;
  },

  identifier(toTest, tester) {
    return tester === '*' || tester === toTest;
  },

  variable(toTest, tester) {
    return toTest.type === 'Identifier' && tester === toTest.name;
  },

  literal(toTest, tester) {
    if (tester === 'true') {
      tester = true;
    } else if (tester === 'false') {
      tester = false;
    }
    return tester == toTest;
  },

  parameters(args, parameters) {
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
            } else if (wildcard) {
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
    } else if (parameters && !args) {
      match = false;
    }
    return match;
  }
};

export default function (sourceNode, queryNode) {
  if (!sourceNode || (queryNode && !queryNode.type)) {
    return false;
  }

  if (!queryNode) {
    return [ sourceNode ];
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
        } else if (sourceNode.expression.type === 'NewExpression' &&
          sourceNode.expression.callee.name === 'RegExp') {
          var toTest = sourceNode.expression.arguments.map(function (arg, index) {
            return index === 0 ? '/' + arg.value + '/' : arg.value;
          }).join('');

          if (logic.regex(toTest, queryNode.value)) {
            return [ sourceNode ];
          }
        } else if (sourceNode.expression.type === 'CallExpression') {
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
      } else if (sourceNode.type === 'MemberExpression' && sourceNode.object) {
        if (logic.regex(sourceNode.object.raw, queryNode.value)) {
          return [ sourceNode.object ];
        }
      } else if (sourceNode.type === 'Literal' && sourceNode.regex) {
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
      if (queryNode.left) {
        if (sourceNode.type === 'AssignmentExpression' &&
          sourceNode.left.type === 'MemberExpression') {
          if (!!module.exports(sourceNode.left, queryNode.left) &&
            sourceNode.operator === queryNode.right.operator &&
            !!module.exports(sourceNode.right, queryNode.right.value)) {
            return [ sourceNode ];
          }
        }
      }
      else {
        var searchNode = sourceNode.callee || sourceNode;
        if (searchNode && searchNode.object && searchNode.property &&
          (module.exports(searchNode.object, queryNode.instance)) &&
          logic.parameters(sourceNode.arguments, queryNode.params)) {

          if (queryNode.methodOrProperty.every(function (name) {
            if (typeof name === 'string') {
              return logic.identifier(searchNode.property.name || searchNode.property.value, name);
            } else if (name.type === 'stringliteral') {
              return searchNode.property.value ? logic.stringliteral(searchNode.property, name.value) :
                logic.stringliteral({
                  value: searchNode.property.name
                }, name.value);
            }
          })) {
            return [ sourceNode ];
          }
        }
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
            } else {
              return [ node ];
            }
          }
        }
        else if (sourceNode.type === 'Identifier' &&
          logic.variable(sourceNode, queryNode.value)) {

          return [ sourceNode ];
        }
        else if (sourceNode.type === 'AssignmentExpression') {
          if (queryNode.assignment) {
            if (sourceNode.left &&
              logic.variable(sourceNode.left, queryNode.value)) {

              if (module.exports(sourceNode.right, queryNode.assignment)) {
                return [ sourceNode ];
              }
            }
          } else if (logic.variable(sourceNode.left, queryNode.value)) {
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
      break;
    }

    case 'binaryexpression': {
      if ((!queryNode.left || !!module.exports(sourceNode.left, queryNode.left)) &&
        (!queryNode.operator || sourceNode.operator === queryNode.operator) &&
        (!queryNode.right || !!module.exports(sourceNode.right, queryNode.right))) {

        return [ sourceNode ];
      }
      break;
    }

    case 'logicalexpression': {
      if ((!queryNode.left || !!module.exports(sourceNode.left, queryNode.left)) &&
        (!queryNode.operator || sourceNode.operator === queryNode.operator) &&
        (!queryNode.right || !!module.exports(sourceNode.right, queryNode.right))) {

        return [ sourceNode ];
      }

      break;
    }

    case 'anycondition': {
      if (sourceNode) {
        var match = false;
        var options = {};
        queryNode.condition.estree.forEach(function (estree) {
          options[estree] = function (node) {
            if (module.exports(node, queryNode.condition)) {
              match = true;
            }
          }
        });
        walk.simple(sourceNode, options);

        if (match) {
          return [ sourceNode ];
        }
      }
      break;
    }

    case 'ifstatement':
    case 'whileloop': {
      if (sourceNode && module.exports(sourceNode.test, queryNode.condition)) {
        return [ sourceNode ];
      }
      break;
    }
  }

  return null;
};
