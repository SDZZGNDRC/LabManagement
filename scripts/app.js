const express = require('express');
const config = require('./config');
const handlers = require('./handlers');
const utils = require('./utils');

var app = express();

app.use(express.json());

app.post('/login', handlers.login);
app.get('/list', utils.authenticateToken, handlers.list);
app.post('/reserve', utils.authenticateToken, handlers.reserve);
app.post('/punch', handlers.punch);
app.get('/genPunchToken', utils.authenticateToken, handlers.genPunchToken);
app.post('/gradeSubmit', utils.authenticateToken, handlers.gradeSubmit);
app.get('/queryScore', utils.authenticateToken, handlers.queryScore);


var server = app.listen(config.server.port, function() {
    console.log('Server listening on port ' + config.server.port);
})
