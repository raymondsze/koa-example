import mongoose from 'mongoose';
import Promise from 'bluebird';
import config from '../../../config';
import User from './models/User';

// switch from MPromise to Bluebird
mongoose.Promise = Promise;

// The db URI without user and password
const mongodbConfig = config.database.mongodb;
const { host, port, username, password, db } = mongodbConfig;
const connection = mongoose.connection;

let prefix = '';
if (username || password) {
  prefix = username ? `${username}:${password}@` : '';
}
const uri = `mongodb://${prefix}${host}:${port}/${db}`;

const IS_DEV_MODE = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
// export the connector function
export default async (/* app */) => {
  // event binding
  connection.on('connecting', () => {
    console.info(`connecting to ${uri}...`);
  });
  connection.on('error', (error) => {
    console.error(`error in connection ${uri}: ${error}`);
  });
  connection.on('connected', () => {
    console.info(`${uri} connected!`);
  });
  connection.once('open', () => {
    console.info(`${uri} connection opened!`);
  });
  connection.on('reconnected', () => {
    console.info(`${uri} reconnected!`);
  });
  connection.on('disconnected', () => {
    console.error(`${uri} disconnected!`);
  });
  if (IS_DEV_MODE) mongoose.set('debug', true);
  await mongoose.connect(uri, { server: { auto_reconnect: true } });
  // register mongoose to database
  return {
    client: mongoose,
    models: {
      User,
    },
  };
};
