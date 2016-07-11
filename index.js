require('babel-core/register');
require('./src/logger');
const startServer = require('./src/server').default;
startServer();
