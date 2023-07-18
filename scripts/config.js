const fs = require('fs');

const configDir = './config.json';

// Read the config file
module.exports = JSON.parse(fs.readFileSync(configDir, 'utf8'));
