const { lstatSync, readdirSync, readFileSync } = require('fs');
const { join } = require('path');

const search = require('../').default;
const consoleReporter = require('./console');

const fileOrDirectory = process.argv[2];
const exact = process.argv[3] === '-e';
const query = process.argv[exact ? 4 : 3];
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

files.forEach(function (file) {
  const source = readFileSync(file, 'utf8');

  try {
    const results = search(query, source, { exact });
    results.sourceFile = file;
    consoleReporter([results]);
  } catch (ex) {
    console.log('Error with file: ' + file, ex.stack);
  }
});
