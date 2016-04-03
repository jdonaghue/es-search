var colors = require('colors');

module.exports = function (results) {
	results.forEach(function (result) {
		if (result.verified.length) {
			var source = result.source.split(/\r\n?|\n/g);
			var report = [];
			var sections = {};
			var formats = {};
			var previousEndLine = 0;

			result.verified.sort(function (a, b) {
				var aStart = a.loc.start.line;
				var bStart = b.loc.start.line;
				var aColStart = a.loc.start.column;
				var bColStart = b.loc.start.column;

				if (aStart < bStart) {
					return -1;
				}
				else if (aStart > bStart) {
					return 1;
				}
				else if (aColStart < bColStart) {
					return -1;
				}
				else if (aColStart > bColStart) {
					return 1;
				}
				return 0;
			});

			result.verified.forEach(function (verified) {
				var start = verified.loc.start.line - 5;
				var startColumn = verified.loc.start.column;
				var endColumn = verified.loc.end.column;

				if (start <= previousEndLine + 5 && report.length) {
					sections = report[report.length - 1];
				}
				else {
					report.push(sections);
				}
				previousEndLine = verified.loc.end.line;

				for (var i = start, end = verified.loc.end.line + 5; i <= end; i++) {
					var prefix = 'line ' + i + ': ';
					var line = source[i - 1];
					if (line != null) {
						if (i >= verified.loc.start.line && i <= verified.loc.end.line) {
							formats[i] = formats[i] || [];
							formats[i].offset = prefix.length;
							formats[i].push({
								start: i === verified.loc.start.line ? startColumn : null,
								end: i === verified.loc.end.line ? endColumn : null
							});
						}
						line = prefix + line;

						if (!sections[i]) {
							sections[i] = line;
						}
					}
				}
			});

			report.forEach(function (sections) {
				console.log('\n==========================> '.yellow + result.sourceFile.yellow);
				for (var lineNum in sections) {
					console.log(formatLine(sections[lineNum], formats[lineNum]));
				}
			});
		}
	});
};

function formatLine(line, formats) {
	if (formats) {
		var colors = [ 'white' ];
		var parts = [];
		var offset = formats.offset;
		var lastStop = offset;
		parts.push(line.slice(0, lastStop));

		formats.forEach(function (format) {
			parts.push(line.slice(lastStop, (format.start || 0) + offset));
			colors.push('green');
			parts.push(line.slice((format.start || 0) + offset, (format.end ? format.end + offset : line.length)));
			colors.push('red');
			lastStop = format.end ? format.end + offset : line.length;
		});

		if (lastStop && lastStop < line.length) {
			parts.push(line.slice(lastStop));
			colors.push('green');
		}

		parts.map(function (part, index) {
			parts[index] = part[colors[index]];
		});
		line = parts.join('');
	}
	else {
		var offset = line.indexOf(':') + 1;
		line = line.slice(0, offset) + line.slice(offset).green;
	}
	return line;
}
