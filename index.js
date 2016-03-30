var parser = require('./parser');

var ast = parser.parse('!let:counter > /a+$/g >+ obj#blah(*, b, *) >+ fn:* + (), agroup + re:/^blah/g');

console.log(JSON.stringify(ast, null, 4));
