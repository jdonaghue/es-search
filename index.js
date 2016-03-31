var parser = require('./parser');
var reporter = require('./reporter');
var search = require('./search');
var acorn = require ('acorn');
var fs = require('fs');
var pathUtil = require('path');

var fileOrDirectory = process.argv[2];
// example: '!let:counter > /a+$/g >+ obj#blah(*, b, *) >+ fn:* + (), agroup + re:/^blah/g');
var query = process.argv.slice(3).join('');
var queryAst = parser.parse(query);
var files = [];

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
		var fileAst = acorn.parse(source, {
			locations: true
		});
		results = results.concat(search(queryAst, fileAst));
	}
	catch (ex) {
		console.log('Error with file: ' + file, ex);
	}
});
reporter(results);
