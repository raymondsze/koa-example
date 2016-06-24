import config from './config';
const env = process.env.NODE_ENV;
const override = require(`./config${env ? `.${env}` : ''}.json`);

// default config is config.js
// based on enviromnent to override the configuraton
export default Object.assign({}, config, override);
