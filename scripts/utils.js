const cfg = require('./config');
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader // Bearer <token>

    if (token == null) {
        res.sendStatus(401)
        return
    }

    jwt.verify(token, cfg.config.server.secretKey, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }

        req.user = user;
        next();
    });
}

exports.authenticateToken = authenticateToken;

function authenticateToken2(req, res, next) {
    const token = req.query.token

    if (token == null) {
        res.sendStatus(401)
        return
    }

    jwt.verify(token, cfg.config.server.secretKey, (err, lab) => {
        if (err) {
            return res.sendStatus(403);
        }

        req.lab = lab;
        next();
    });
}

exports.authenticateToken2 = authenticateToken2;

