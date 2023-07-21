const db = require('./database');
const jwt = require('jsonwebtoken');
const cfg = require('./config');
const utils = require('./utils');

// handler for the /lab/ endpoint
function handler_home(req, res) {
    // return the login.html page
    res.sendFile('/home/ubuntu/project/LabManagement/resources/html/login.html');
}

exports.home = handler_home;

// handler for the /lab/login endpoint
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

// handler for the /lab/list endpoint
// List info about the labs
function handler_list(req, res) {
    const reserved = req.query.reserved;
    if (reserved == 'true') {
        const user = req.user.username;
        const query = `SELECT * FROM Reservations WHERE User = '${user}'`;
        db.con.query(query, (err, result) => {
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
    } else {
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
}

exports.list = handler_list;

// handler for the /lab/labManage endpoint
function handler_labManage(req, res) {
    // Check if the role is "teacher"
    if (req.role !== "teacher") {
        res.status(403).json({ status: "error", message: "Unauthorized access. Only teachers are allowed to manage labs." });
        return;
    }

    // Check if the action is valid (either "Add" or "Delete")
    const validActions = ["Add", "Delete"];
    if (!req.body.action || !validActions.includes(req.body.action)) {
        res.status(400).json({ status: "error", message: "Invalid action. Action must be either 'Add' or 'Delete'." });
        return;
    }

    // Extract the lab details from the request body
    const { name, startTime, endTime } = req.body;

    // Ensure that all the required fields are present
    if (!name || !startTime || !endTime) {
        res.status(400).json({ status: "error", message: "Missing parameters. Please ensure that all the required fields are present." });
    }

    // Perform the corresponding action based on the request body's action
    if (req.body.action === "Add") {
        // Insert the lab record into the MySQL table
        db.con.query('INSERT INTO Lab (Lab, StartTime, EndTime) VALUES (?, ?, ?);', [name, startTime, endTime], (err, result) => {
            if (err) {
                res.status(500).json({ status: 'error', message: err.message });
            } else {
                res.json({ status: 'success', message: 'Lab added successfully.' });
            }
        });
    } else if (req.body.action === "Delete") {
        // Delete the lab record from the MySQL table
        db.con.query('DELETE FROM Lab WHERE Lab = ? AND StartTime = ? AND EndTime = ?;', [name, startTime, endTime], (err, result) => {
            if (err) {
                res.status(500).json({ status: 'error', message: err.message });
            } else {
                res.json({ status: 'success', message: 'Lab deleted successfully.' });
            }
        });

        // TODO: Delete all reservations for the lab
    }
}

exports.labManage = handler_labManage;

// handler for the /lab/reserve endpoint
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

// handler for the /lab/reservedLabs endpoint
function handler_reservedLabs(req, res) {
    
}


// handler for the /lab/punch endpoint
function handler_punch(req, res) {
    const { lab, username, password } = req.body;

    // 验证lab是否对应
    if (lab != req.lab.lab) {
        res.json({status: 'error', message: 'Invalid lab'});
        return;
    }

    // Check if the current time is within the reservation time
    // console.log(currentTime)
    // if (currentTime < req.lab.startTime || currentTime > req.lab.endTime) {
    //     res.json({status: 'error', message: '实验还没开始或已经结束'});
    //     return;
    // }

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


        const query = `UPDATE Reservations SET Status = 2 WHERE Lab = '${lab}' AND User = '${username}';`;
        db.con.query(query, (err, result) => {
            console.log(result);
            if (err) {
                res.status(500).json({ status: 'error', message: err.message });
                return;
            }
            console.log('success');
            res.json({status: 'success', message: ''});
            return;
        });
    });
}

exports.punch = handler_punch;

// handler for the /lab/genPunchToken endpoint
function handler_genPunchToken(req, res) {
    // Check if the role is "teacher"
    if (req.role != 'teacher') {
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

// handler for the /lab/studentManage endpoint
function handler_studentManage(req, res) {
    // Check if the role is "teacher"
    if (req.role !== "teacher") {
        res.status(403).json({ status: "error", message: "Unauthorized access. Only teachers are allowed to manage students." });
        return;
    }

    // Check if the action is valid (either "Add" or "Delete")
    const validActions = ["Add", "Delete"];
    if (!req.body.action || !validActions.includes(req.body.action)) {
        res.status(400).json({ status: "error", message: "Invalid action. Action must be either 'Add' or 'Delete'." });
        return;
    }

    // Extract the student details from the request body
    const { username, password } = req.body;

    // Check if required fields are given
    if (!username || (req.body.action === "Add" && !password)) {
        res.status(400).json({ status: "error", message: "Please provide both username and password." });
        return;
    }

    // Perform the corresponding action based on the request body's action
    if (req.body.action === "Add") {
        // Check if a user with the same username already exists in the table
        db.con.query('SELECT * FROM User WHERE username = ?', [username], (err, result) => {
            if (err) {
                res.status(500).json({ status: 'error', message: err.message });
                return;
            }

            if (result.length > 0) {
                res.status(409).json({ status: 'error', message: 'A user with the same username already exists.' });
                return;
            }

            // Insert the student record into the MySQL table
            db.con.query('INSERT INTO User (username, password) VALUES (?, ?)', [username, password], (err, result) => {
                if (err) {
                    res.status(500).json({ status: 'error', message: err.message });
                } else {
                    res.json({ status: 'success', message: 'Student added successfully.' });
                }
            });
        });
    } else if (req.body.action === "Delete") {
        // Delete the student record from the MySQL table
        db.con.query('DELETE FROM User WHERE username = ?', [username], (err, result) => {
            if (err) {
                res.status(500).json({ status: 'error', message: err.message });
            } else {
                res.json({ status: 'success', message: 'Student deleted successfully.' });
            }
        });

        // TODO: Delete all reservations for the student
        // TODO: Delete all scores for the student
    }
}

exports.studentManage = handler_studentManage;

// handler for the /lab/listStudents endpoint
function handler_listStudents(req, res) {
    // Check if the role is "teacher"
    if (req.role !== "teacher") {
        res.status(403).json({ status: "error", message: "Unauthorized access. Only teachers are allowed to list students." });
        return;
    }

    // Fetch all student records from the User table
    db.con.query('SELECT * FROM User', (err, result) => {
        if (err) {
            res.status(500).json({ status: 'error', message: err.message });
        } else {
            // Check if the user is a student using the utils.getRole() function
            // If the user is a student, add the username to the students array
            const students = [];
            for (let i = 0; i < result.length; i++) {
                const record = result[i];
                if (utils.getRole(record.username) === "student") {
                    students.push({"username": record.username});
                }
            }
            
            res.json({ status: 'success', students });
        }
    });
}

exports.listStudents = handler_listStudents;

// handler for the /lab/gradeSubmit endpoint
function handler_gradeSubmit(req, res) {
    if (req.role != 'teacher') {
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

// handler for the /lab/queryScore endpoint
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

