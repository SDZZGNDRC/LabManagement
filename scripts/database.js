const mysql = require('mysql');
const cfg = require('./config');

var con = mysql.createConnection({
    host: cfg.config.mysql.host,
    user: cfg.config.mysql.user,
    password: cfg.config.mysql.password,
    database: cfg.config.mysql.database
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});

exports.con = con;