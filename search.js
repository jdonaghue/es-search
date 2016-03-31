var walk = require('./node_modules/acorn/dist/walk');

module.exports = function (queryAst, fileAst) {
	var results = [];
	var query = queryAst;

	while (query) {
		switch (query.type) {
			
		}

		query = query.parent;
	}

	return results;
};
