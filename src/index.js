import { parse } from '@babel/parser';
import { lstatSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

import consoleReporter from './console';
import search from './search';
import { parse as queryParse } from './queryParser';
import parseOptions from './parseOptions';

const fileOrDirectory = process.argv[2];
const query = process.argv.slice(3).join('');
const queryAst = queryParse(query);
let files = [];

function readDirectory(directory) {
  const paths = readdirSync(directory);
  let files = [];

  paths.forEach(function (path) {
    path = join(directory, path);
    if (lstatSync(path).isDirectory()) {
      files = files.concat(readDirectory(path));
    } else if (path.split('.').pop() === 'js') {
      files.push(path);
    }
  });
  return files;
}

if (lstatSync(fileOrDirectory).isDirectory()) {
  files = readDirectory(fileOrDirectory);
} else {
  files.push(fileOrDirectory);
}

const results = [];
files.forEach(function (file) {
  const source = readFileSync(file, 'utf8');
  try {
    const fileAst = parse(source, parseOptions);
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
    
    consoleReporter([results[results.length - 1]]);
  } catch (ex) {
    console.log('Error with file: ' + file, ex.stack);
  }
});
