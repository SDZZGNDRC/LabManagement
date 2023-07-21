const cfg = require('./config');
const jwt = require('jsonwebtoken');
const db = require('./database');


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

function authenticateToken3(req, res, next) {
    // const authHeader = req.headers['authorization']
    const token = req.cookies.token // Bearer <token>

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

exports.authenticateToken3 = authenticateToken3;

// Check user's permissions: root, teacher, student.
function checkPermission(req, res, next) {
    token = req.cookies.token;
    if (token == null) {
        res.sendStatus(401);
        return;
    }

    jwt.verify(token, cfg.config.server.secretKey, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }

        username = user.username;
        const query  = `SELECT * FROM User WHERE username = '${username}'`;

        db.con.query(query, (err, result) => {
            if (err) {
                console.log(err);
                res.sendStatus(500);
                return;
            }

            // Check if the user exists.
            if (result.length == 0) {
                res.sendStatus(401);
                return;
            }

            // set the role of the user.
            req.role = getRole(username);

            next();
        });
    });
}

exports.checkPermission = checkPermission;

// get the role of username.
function getRole(username) {
    if (username == 'root' || username == 'teacher') {
        return 'teacher';
    } else {
        return 'student';
    }
}

exports.getRole = getRole;
