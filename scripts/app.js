const express = require('express');
const cfg = require('./config');
const handlers = require('./handlers');
const utils = require('./utils');

var app = express();

app.use(express.json());

app.post('/lab/login', handlers.login);
app.get('/lab/list', utils.authenticateToken, handlers.list);
app.post('/lab/reserve', utils.authenticateToken, handlers.reserve);
app.post('/lab/punch', utils.authenticateToken2, handlers.punch);
app.get('/lab/genPunchToken', utils.authenticateToken, handlers.genPunchToken);
app.post('/lab/gradeSubmit', utils.authenticateToken, handlers.gradeSubmit);
app.get('/lab/queryScore', utils.authenticateToken, handlers.queryScore);


var server = app.listen(cfg.config.server.port, function() {
    console.log('Server listening on port ' + cfg.config.server.port);
})
