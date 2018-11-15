require('colors');

function formatLine(line, formats) {
  if (formats) {
    const colors = ['white'];
    const parts = [];
    const offset = formats.offset;
    let lastStop = offset;
    parts.push(line.slice(0, lastStop));

    formats.forEach(function (format) {
      parts.push(line.slice(lastStop, (format.start || 0) + offset));
      colors.push('green');
      parts.push(line.slice(
        (format.start || 0) + offset,
        (format.end ? format.end + offset : line.length)));
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
  } else {
    const offset = line.indexOf(':') + 1;
    line = line.slice(0, offset) + line.slice(offset).green;
  }
  return line;
}

module.exports = function (results) {
  results.forEach(function (result) {
    if (result.found.length) {
      const source = result.source.split(/\r\n?|\n/g);
      const report = [];
      const formats = {};
      let sections = {};
      let previousEndLine = 0;

      result.found.sort(function (a, b) {
        const aStart = a.loc.start.line;
        const bStart = b.loc.start.line;
        const aColStart = a.loc.start.column;
        const bColStart = b.loc.start.column;

        if (aStart < bStart) {
          return -1;
        } else if (aStart > bStart) {
          return 1;
        } else if (aColStart < bColStart) {
          return -1;
        } else if (aColStart > bColStart) {
          return 1;
        }
        return 0;
      });

      result.found.forEach(function (verified) {
        const start = verified.loc.start.line - 5;
        const startColumn = verified.loc.start.column;
        const endColumn = verified.loc.end.column;

        if (start <= previousEndLine + 5 && report.length) {
          sections = report[report.length - 1];
        } else {
          report.push(sections);
        }
        previousEndLine = verified.loc.end.line;

        for (let i = start, end = verified.loc.end.line + 5; i <= end; i++) {
          const prefix = 'line ' + i + ': ';
          let line = source[i - 1];
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
        for (let lineNum in sections) {
          console.log(formatLine(sections[lineNum], formats[lineNum]));
        }
      });
    }
  });
};
