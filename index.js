var parser = require('./parser');
var consoleReporter = require('./console');
var search = require('./search');
var acorn = require ('./node_modules/acorn/dist/acorn_loose');
var fs = require('fs');
var pathUtil = require('path');

var fileOrDirectory = process.argv[2];
var query = process.argv.slice(3).join('');
var queryAst = parser.parse(query);
var files = [];
//console.log(JSON.stringify(queryAst, null, 4));

function readDirectory(directory) {
	var paths = fs.readdirSync(directory);
	var files = [];

	paths.forEach(function (path) {
		path = pathUtil.join(directory, path);
		if (fs.lstatSync(path).isDirectory()) {
			files = files.concat(readDirectory(path));
		}
		else if (path.split('.').pop() === 'js') {
			files.push(path);
		}
	});
	return files;
}

if (fs.lstatSync(fileOrDirectory).isDirectory()) {
	files = readDirectory(fileOrDirectory);
}
else {
	files.push(fileOrDirectory);
}

var results = [];
files.forEach(function (file) {
	var source = fs.readFileSync(file, 'utf8');
	try {
		var fileAst = acorn.parse_dammit(source, {
			locations: true,
			sourceFile: file,
			allowImportExportEverywhere: true,
			ecmaVersion: 7
		});
		var unique = [];
		var lineNumbers = {};
		var verified = search(queryAst, fileAst);
		verified.forEach(function (node) {
			var lineNumber = node.loc.start.line + ':' + node.loc.start.column + '-' +
				node.loc.end.line + ':' + node.loc.end.column;
			if (!(lineNumber in lineNumbers)) {
				unique.push(node);
				lineNumbers[lineNumber] = true;
			}
		});
		results.push({
			verified: unique,
			source: source,
			sourceFile: file
		});
		consoleReporter([ results[results.length - 1] ]);
	}
	catch (ex) {
		console.log('Error with file: ' + file, ex.stack);
	}
});
