export function reducer({ start, end, loc, range, extra, ...rest }) {
  return Object.keys(rest).reduce((acc, property) => {
    if (Array.isArray(acc[property])) {
      acc[property] = acc[property].map(reducer);
    } else if (acc[property] && typeof acc[property] === 'object') {
      acc[property] = reducer(acc[property]);
    }
    return acc;
  }, rest);
}

export function unique(nodes) {
  const lineNumbers = {};
  return nodes.reduce((acc, node) => {
    const lineNumber = `${node.loc.start.line}:${node.loc.start.column}-${node.loc.end.line}:${node.loc.end.column}`;
    if (!(lineNumber in lineNumbers)) {
      acc.push(node);
      lineNumbers[lineNumber] = true;
    }
    return acc;
  }, []);
}
