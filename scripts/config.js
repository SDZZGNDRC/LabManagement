const exp = require('constants');
const fs = require('fs');

const configDir = '/home/ubuntu/project/LabManagement/config.json';

// Read the config file
let raw_data = fs.readFileSync(configDir, 'utf8');
let config = JSON.parse(raw_data);

exports.config = config;
