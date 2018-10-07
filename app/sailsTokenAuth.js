const jwt = require('jsonwebtoken');

const getSecretToken = () => process.env.TOKEN_SECRET || 'jay token';

const issueToken = payload => jwt.sign(payload, getSecretToken());
const verifyToken = (token, verified) => jwt.verify(token, getSecretToken(), {}, verified);

const tokenAuth = (req, res, next) => {
    let reqToken = null;
    if (req.headers && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ');
        if (parts.length === 2) {
            const scheme = parts[0];
            const credentials = parts[1];

            if (/^Bearer$/i.test(scheme)) {
                reqToken = credentials;
            }
        } else {
            res.json(401, { err: 'Format is Authorization: Bearer [token]' });
            return;
        }
    } else if (req.params.token) {
        reqToken = req.params.token;
        // We delete the token from param to not mess with blueprints
        delete req.query.token;
    } else {
        res.status(401).json({ err: 'No Authorization header was found' });
        return;
    }

    verifyToken(reqToken, (err, myToken) => {
        if (err) {
            res.json(401, { err: 'The token is not valid' });
            return;
        }

        req.token = myToken;

        next();
    });
};

module.exports.issueToken = issueToken;
module.exports.verifyToken = verifyToken;
module.exports.tokenAuth = tokenAuth;
