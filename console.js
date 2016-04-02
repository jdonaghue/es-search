var colors = require('colors');

module.exports = function (results) {
	results.forEach(function (result) {
		if (result.verified.length) {
			var source = result.source.split(/\r\n?|\n/g);
			var report = [];
			var previousEndLine = 0;

			result.verified.sort(function (a, b) {
				if (a.loc.start.line < b.loc.start.line) {
					return -1;
				}
				else if (a.loc.start.line > b.loc.start.line) {
					return 1;
				}
				return 0;
			});

			result.verified.forEach(function (verified, index) {
				var toPrint = {};
				var start = verified.loc.start.line - 5;

				if (start <= previousEndLine + 5 && report.length > 0) {
					toPrint = report[report.length - 1];
					start = previousEndLine + 1;
				}
				else {
					report.push(toPrint);
				}
				previousEndLine = verified.loc.end.line;

				for (var i = start, end = verified.loc.end.line + 5; i <= end; i++) {
					var line = source[i - 1];
					if (line != null) {
						if (i >= verified.loc.start.line && i <= verified.loc.end.line) {
							var begining = null;
							var ending = null;

							if (i === verified.loc.start.line) {
								begining = line.slice(0, verified.loc.start.column);
							}
							if (i === verified.loc.end.line) {
								ending = line.slice(verified.loc.end.column);
							}

							if (begining && ending) {
								var match = line.slice(verified.loc.start.column, verified.loc.end.column);
								line = 'line ' + i + ': ' + begining.green + match.red + ending.green;
							}
							else if (begining) {
								line = 'line ' + i + ': ' + begining.green + line.slice(verified.loc.start.column).red;
							}
							else if (ending) {
								line = 'line ' + i + ': ' + line.slice(0, verified.loc.end.column).red + ending.green;
							}
							else {
								line = 'line ' + i + ': ' + line.red;
							}
							line.formatted = true;
						}
						else {
							line = 'line ' + i + ': ' + line.green;
						}
						if (!toPrint[i] || !toPrint[i].formatted) {
							toPrint[i] = line;
						}
					}
				}
			});

			report.forEach(function (toPrint) {
				console.log('\n==========================> '.yellow + result.sourceFile.yellow);
				for (var lineNum in toPrint) {
					console.log(toPrint[lineNum]);
				}
			});
		}
	});
};
