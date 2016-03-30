var parser = require('./parser');

var ast = parser.parse(process.argv[2]);

console.dir(ast);
