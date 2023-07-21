const express = require('express');
const cfg = require('./config');
const handlers = require('./handlers');
const utils = require('./utils');
const cookieParser = require('cookie-parser');

var app = express();

app.use(express.static('/home/ubuntu/project/LabManagement/public'));
app.use(express.json());
app.use(cookieParser());

// For page
app.get('/', function(req, res) {
    res.sendFile('/home/ubuntu/project/LabManagement/resources/html/login.html');
});
app.get('/home', utils.authenticateToken3, utils.checkPermission, function(req, res) {
    if (req.role == 'student') {
        res.sendFile('/home/ubuntu/project/LabManagement/resources/html/home-student.html');
    } else {
        res.sendFile('/home/ubuntu/project/LabManagement/resources/html/home-teacher.html');
    }
});
app.get('/reserve', utils.authenticateToken3, function(req, res) {
    res.sendFile('/home/ubuntu/project/LabManagement/resources/html/reserve.html');
});
app.get('/genPunchToken', utils.authenticateToken3, function(req, res) {
    res.sendFile('/home/ubuntu/project/LabManagement/resources/html/genPunchToken.html');
}); 
app.get('/punch', utils.authenticateToken2, function(req, res) {
    res.sendFile('/home/ubuntu/project/LabManagement/resources/html/punch.html');
});
app.get('/gradeSubmit', utils.authenticateToken3, function(req, res) {
    res.sendFile('/home/ubuntu/project/LabManagement/resources/html/gradeSubmit.html');
});
app.get('/queryScore', utils.authenticateToken3, function(req, res) {
    res.sendFile('/home/ubuntu/project/LabManagement/resources/html/queryScore.html');
});
app.get('/labManage', utils.authenticateToken3, function(req, res) {
    res.sendFile('/home/ubuntu/project/LabManagement/resources/html/labManage.html');
});
app.get('/studentManage', utils.authenticateToken3, function(req, res) {
    res.sendFile('/home/ubuntu/project/LabManagement/resources/html/studentManage.html');
});

// For api
app.post('/lab/login', handlers.login);
app.get('/lab/list', utils.authenticateToken, handlers.list);
app.post('/lab/labManage', utils.authenticateToken, utils.checkPermission, handlers.labManage);
app.post('/lab/reserve', utils.authenticateToken, handlers.reserve);
app.post('/lab/punch', utils.authenticateToken2, handlers.punch);
app.get('/lab/genPunchToken', utils.authenticateToken, utils.checkPermission, handlers.genPunchToken);
app.post('/lab/gradeSubmit', utils.authenticateToken, utils.checkPermission, handlers.gradeSubmit);
app.post('/lab/studentManage', utils.authenticateToken, utils.checkPermission, handlers.studentManage);
app.get('/lab/listStudents', utils.authenticateToken, utils.checkPermission, handlers.listStudents);
app.get('/lab/queryScore', utils.authenticateToken, handlers.queryScore);


var server = app.listen(cfg.config.server.port, function() {
    console.log('Server listening on port ' + cfg.config.server.port);
})
