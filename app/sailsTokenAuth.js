var jwt = require('jsonwebtoken');

var issueToken = function(payload) {
	var token = jwt.sign(payload, process.env.TOKEN_SECRET || 'jay token');
	return token;
};

var verifyToken = function(token, verified) {
	return jwt.verify(token, process.env.TOKEN_SECRET || 'jay token', {}, verified);
};

var tokenAuth = function(req, res, next) {
	var token;
	if (req.headers && req.headers.authorization) {
		var parts = req.headers.authorization.split(' ');
		if (2 == parts.length) {
			var scheme = parts[0];
			var credentials = parts[1];

			if (/^Bearer$/i.test(scheme)) {
				token = credentials;
			}
		} else {
			return res.json(401, {err: 'Format is Authorization: Bearer [token]'});
		}
	} else if (req.params.token) {
		token = req.params.token;
		// We delete the token from param to not mess with blueprints
		delete req.query.token;
	} else {
		return res.status(401).json({err: 'No Authorization header was found'});
	}

	verifyToken(token, function(err, token) {
		if (err) {
			return res.json(401, {err: 'The token is not valid'});
		}

		req.token = token;

		next();
	});
};

module.exports.issueToken = issueToken;
module.exports.verifyToken = verifyToken;
module.exports.tokenAuth = tokenAuth;
