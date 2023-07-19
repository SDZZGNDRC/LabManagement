const db = require('./database');
const jwt = require('jsonwebtoken');
const cfg = require('./config');

// handler for the / endpoint
function handler_home(req, res) {
    // return the login.html page
    res.sendFile('/home/ubuntu/project/LabManagement/resources/html/login.html');
}

exports.home = handler_home;

// handler for the /login endpoint
function handler_login(req, res) {
    username = req.body.username;
    password = req.body.password;
    
    // SQL query to retrieve the record with the specified username
    const query = `SELECT * FROM User WHERE username = '${username}'`

    db.con.query(query, (err, result) => {
        if (err) {
            console.log(err);
            return;
        }

        // Check if the username exists
        if (result.length == 0) {
            res.json({status: 'error', message: 'Username does not exist'});
            return;
        }

        const record = result[0];

        // Check if the password is correct
        if (record.password != password) {
            res.json({status: 'error', message: 'Incorrect password'});
            return;
        }

        // Generate a JWT token
        const token = jwt.sign(
            {username: username}, 
            cfg.config.server.secretKey, 
            {expiresIn: '1h'}
        );

        res.json({status: 'success', token: token});
    });
}

exports.login = handler_login;

// handler for the /list endpoint
function handler_list(req, res) {
    db.con.query('SELECT * FROM Lab', (err, result) => {
        if (err) {
            res.status(500).json({ status: 'error', message: err.message });
            return;
        } else {
            const labs = result.map((lab) => ({
                "name": lab.Lab,
                "startTime": lab.StartTime,
                "endTime": lab.EndTime,
            }));

            res.json({status: 'success', labs});
        }
    });
}

exports.list = handler_list;

// handler for the /reserve endpoint
function handler_reserve(req, res) {
    const { lab, startTime, endTime } = req.body;
    const user = req.user.username;

    const reservationTime = Math.round(Date.now() / 1000);

    // Check if the startTime and endTime are valid.
    // The startTime must be in the future, and the endTime must be after the startTime.
    if (startTime < reservationTime) {
        res.json({status: 'error', message: 'Invalid start time'});
        return;
    }
    if (endTime <= startTime) {
        res.json({status: 'error', message: 'Invalid end time'});
        return;
    }

    // Load lab info from the database, and check if the lab exists
    const query = `SELECT * FROM Lab WHERE Lab = '${lab}'`;
    db.con.query(query, (err, result) => {
        if (err) {
            res.status(500).json({ status: 'error', message: err.message });
            return;
        }

        let match_labName = false;
        let match_time = false;
        for (let i = 0; i < result.length; i++) {
            const record = result[i];
            if (record.Lab == lab) {
                match_labName = true;
                match_time = false;
                if (record.StartTime <= startTime && record.EndTime >= endTime) {
                    match_time = true;
                    break;
                }
            }
        }

        if (!match_labName) {
            res.json({status: 'error', message: 'Invalid lab'});
            return;
        }

        if (!match_time) {
            res.json({status: 'error', message: 'Invalid time'});
            return;
        }

        // Check if the user has already reserved the lab
        const query = `SELECT * FROM Reservations WHERE Lab = '${lab}' AND User = '${user}'`;
        db.con.query(query, (err, result) => {
            if (err) {
                res.status(500).json({ status: 'error', message: err.message });
                return;
            }

            if (result.length > 0) {
                for (let i = 0; i < result.length; i++) {
                    const record = result[i];
                    if (record.StartTime == startTime && record.EndTime == endTime) {
                        res.json({status: 'error', message: 'Already reserved'});
                        return;
                    }
                }
            }

            // Insert the reservation into the database
            const reservationData = {
                Lab: lab,
                User: user,
                StartTime: startTime,
                EndTime: endTime,
                ReservationTime: reservationTime,
                Status: 1
            };

            db.con.query('INSERT INTO Reservations SET ?', reservationData, (err, result) => {
                if (err) {
                    res.status(500).json({ status: 'error', message: err.message });
                    return;
                } else {
                    res.json({status: 'success', message: ''});
                }
            });
        });
    });

}

exports.reserve = handler_reserve;

// handler for the /punch endpoint
function handler_punch(req, res) {
    const { lab, username, password } = req.body;

    // 验证lab是否对应
    if (lab != req.lab.lab) {
        res.json({status: 'error', message: 'Invalid lab'});
        return;
    }

    // 验证用户名和密码是否正确
    // SQL query to retrieve the record with the specified username
    const query = `SELECT * FROM User WHERE username = '${username}'`

    db.con.query(query, (err, result) => {
        if (err) {
            console.log(err);
            return;
        }

        // Check if the username exists
        if (result.length == 0) {
            res.json({status: 'error', message: 'Username does not exist'});
            return;
        }

        const record = result[0];

        // Check if the password is correct
        if (record.password != password) {
            res.json({status: 'error', message: 'Incorrect password'});
            return;
        }

        // Change the status of the reservation to 2
        const currentTime = Math.round(Date.now() / 1000);
        const query = `UPDATE Reservations SET Status = 2 WHERE Lab = '${lab}' AND User = '${username}' AND StartTime <= ${currentTime} AND EndTime >= ${currentTime}`;
        db.con.query(query, (err, result) => {
            if (err) {
                res.status(500).json({ status: 'error', message: err.message });
                return;
            }
            res.json({status: 'success', message: ''});
        });
    });
}

exports.punch = handler_punch;

// handler for the /genPunchToken endpoint
function handler_genPunchToken(req, res) {
    // TODO: Check if the user is an admin(used by teachers)
    if (req.user.username != 'root') {
        res.json({status: 'error', message: 'Permission denied'});
        return;
    }

    if (!req.query.lab) {
        res.json({status: 'error', message: 'lab parameter is required'});
    }

    // Check the lab name is valid
    const query = `SELECT * FROM Lab WHERE Lab = '${req.query.lab}'`;
    db.con.query(query, (err, result) => {
        if (err) {
            res.status(500).json({ status: 'error', message: err.message });
            return;
        }

        if (result.length == 0) {
            res.json({status: 'error', message: 'Invalid lab'});
            return;
        }

        // Generate a JWT token
        const token = jwt.sign(
            {lab: req.query.lab}, 
            cfg.config.server.secretKey, 
            {expiresIn: '1h'}
        );

        res.json({status: 'success', token: token});
    });
}

exports.genPunchToken = handler_genPunchToken;

// handler for the /gradeSubmit endpoint
function handler_gradeSubmit(req, res) {
    // TODO: Check if the user is an admin(used by teachers)
    if (req.user.username != 'root') {
        res.json({status: 'error', message: 'Permission denied'});
        return;
    }

    const { username, lab, score } = req.body;
    if (!username || !lab || !score) {
        res.json({status: 'error', message: 'Missing parameters'});
        return;
    }

    // Check if the lab exists
    const query = `SELECT * FROM Lab WHERE Lab = '${lab}'`;
    db.con.query(query, (err, result) => {
        if (err) {
            res.status(500).json({ status: 'error', message: err.message });
            return;
        }

        if (result.length == 0) {
            res.json({status: 'error', message: 'Invalid lab'});
            return;
        }

        // Check if the user exists
        const query = `SELECT * FROM User WHERE username = '${username}'`;
        db.con.query(query, (err, result) => {
            if (err) {
                res.status(500).json({ status: 'error', message: err.message });
                return;
            }

            if (result.length == 0) {
                res.json({status: 'error', message: 'Invalid user'});
                return;
            }

            // Check if the user has already submitted the lab
            const query = `SELECT * FROM Scores WHERE Lab = '${lab}' AND User = '${username}'`;
            db.con.query(query, (err, result) => {
                if (err) {
                    res.status(500).json({ status: 'error', message: err.message });
                    return;
                }

                if (result.length > 0) {
                    res.json({status: 'error', message: 'Already submitted'});
                    return;
                }

                // Insert the grade into the database
                const gradeData = {
                    Lab: lab,
                    User: username,
                    Score: score
                };

                db.con.query('INSERT INTO Scores SET ?', gradeData, (err, result) => {
                    if (err) {
                        res.status(500).json({ status: 'error', message: err.message });
                        return;
                    } else {
                        res.json({status: 'success', message: ''});
                    }
                });
            });
        });
    });
}

exports.gradeSubmit = handler_gradeSubmit;

// handler for the /queryScore endpoint
function handler_queryScore(req, res) {
    const { username, lab } = req.query;
    
    let query = 'SELECT * FROM Scores';
    let queryParams = [];

    // Construct the query params
    if (username && lab) {
        query += ' WHERE User = ? AND Lab = ?';
        queryParams = [username, lab];
    } else if (username) {
        query += ' WHERE User = ?';
        queryParams = [username];
    } else if (lab) {
        query += ' WHERE Lab = ?';
        queryParams = [lab];
    }

    db.con.query(query, queryParams, (err, result) => {
        if (err) {
            res.status(500).json({ status: 'error', message: err.message });
            return;
        } else {
            const records = result.map((row) => ({
                lab: row.Lab,
                username: row.User,
                score: row.Score
            }));

            res.json({status: 'success', records: records});
        }
    });
}

exports.queryScore = handler_queryScore;

