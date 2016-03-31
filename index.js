var parser = require('./parser');
var acorn = require ('acorn');

// '!let:counter > /a+$/g >+ obj#blah(*, b, *) >+ fn:* + (), agroup + re:/^blah/g');
var queryAst = parser.parse(process.argv.slice(3).join(''));

console.log(JSON.stringify(queryAst, null, 4));
