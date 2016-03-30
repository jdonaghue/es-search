var parser = require('./parser');

var ast = parser.parse('!let:counter > /a+$/g >+ obj#blah(*, b, *) >+ fn:* + ()');

console.log(JSON.stringify(ast, null, 4));
