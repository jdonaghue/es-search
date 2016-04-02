var parser = require('./parser');
var consoleReporter = require('./console');
var search = require('./search');
var acorn = require ('./node_modules/acorn/dist/acorn_loose');
var fs = require('fs');
var pathUtil = require('path');

var fileOrDirectory = process.argv[2];
// example: '!let:counter > /a+$/g >+ obj#blah(*, b, *) >+ fn:* + (), agroup + re:/^blah/g');
var query = process.argv.slice(3).join('');
var queryAst = parser.parse(query);
var files = [];
//console.log(query);
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
		results.push({ verified: search(queryAst, fileAst), source: source, sourceFile: file });
	}
	catch (ex) {
		console.log('Error with file: ' + file, ex);
	}
});
consoleReporter(results);
