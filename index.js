const parser = require('./parser');
const consoleReporter = require('./console');
const search = require('./search');
const acorn = require ('./node_modules/acorn/dist/acorn_loose');
const fs = require('fs');
const pathUtil = require('path');

const fileOrDirectory = process.argv[2];
const query = process.argv.slice(3).join('');
const queryAst = parser.parse(query);
let files = [];

function readDirectory(directory) {
	const paths = fs.readdirSync(directory);
	let files = [];

	paths.forEach(function (path) {
		path = pathUtil.join(directory, path);
		if (fs.lstatSync(path).isDirectory()) {
			files = files.concat(readDirectory(path));
		} else if (path.split('.').pop() === 'js') {
			files.push(path);
		}
	});
	return files;
}

if (fs.lstatSync(fileOrDirectory).isDirectory()) {
	files = readDirectory(fileOrDirectory);
} else {
	files.push(fileOrDirectory);
}

const results = [];
files.forEach(function (file) {
	const source = fs.readFileSync(file, 'utf8');
	try {
		const fileAst = acorn.parse_dammit(source, {
			locations: true,
			sourceFile: file,
			allowImportExportEverywhere: true,
			ecmaVersion: 7
		});
		const unique = [];
		const lineNumbers = {};
		const verified = search(queryAst, fileAst);
		verified.forEach(function (node) {
			const lineNumber = `${node.loc.start.line}:${node.loc.start.column}-${node.loc.end.line}:${node.loc.end.column}`;
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
	} catch (ex) {
		console.log('Error with file: ' + file, ex.stack);
	}
});
