const config = require('./config');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer <token>

    if (token == null) {
        res.sendStatus(401)
        return
    }

    jwt.verify(token, config.server.secretKey, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }

        req.user = user;
        next();
    });
}

exports.authenticateToken = authenticateToken;