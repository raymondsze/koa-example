import mongoose from 'mongoose';
import Promise from 'bluebird';
import logger from '../../logger';
import config from '../../../config';
import models from './models';

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

// export the connector function
export default async (/* app */) => {
  // event binding
  connection.on('connecting', () => {
    logger.info(`connecting to ${uri}...`);
  });
  connection.on('error', (error) => {
    logger.error(`error in connection ${uri}: ${error}`);
  });
  connection.on('connected', () => {
    logger.info(`${uri} connected!`);
  });
  connection.once('open', () => {
    logger.info(`${uri} connection opened!`);
  });
  connection.on('reconnected', () => {
    logger.info(`${uri} reconnected!`);
  });
  connection.on('disconnected', () => {
    logger.error(`${uri} disconnected!`);
  });
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    mongoose.set('debug', true);
  }
  await mongoose.connect(uri, { server: { auto_reconnect: true } });
  // register mongoose to database
  return {
    client: mongoose,
    models,
  };
};
