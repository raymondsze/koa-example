import redis from 'redis';
import Promise from 'bluebird';
import config from '../../../config';
// let redis function return promise
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

const redisConfig = config.database.redis;
const { host, port, username, password, db } = redisConfig;
let prefix = '';
if (username || password) {
  prefix = username ? `${username}:${password}@` : '';
}
const uri = `redis://${prefix}${host}:${port}/${db}`;

export default async (/* app */) => {
  // we need this value to indicate whether redis is first connect successfully
  // due to there is no callback design in createClient
  let initialized = false;
  return new Promise((resolve, reject) => {
    const client = redis.createClient({
      ...config.database.redis,
      retry_strategy: (options) => {
        if (options.error.code === 'ECONNREFUSED') {
          // End reconnecting on a specific error and flush all commands with a individual error
          return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          // End reconnecting after a specific timeout and
          // flush all commands with a individual error
          return new Error('Retry time exhausted');
        }
        if (options.times_connected > 10) {
          // End reconnecting with built in error
          return undefined;
        }
        // reconnect after
        return Math.max(options.attempt * 100, 60000);
      },
    });
    client.on('ready', () => {
      console.info(`${uri} connected!`);
    });
    client.on('connect', () => {
      console.info(`connecting to ${uri}...`);
      if (!initialized) resolve(client);
      initialized = true;
    });
    client.on('reconnecting', () => {
      console.info(`reconnecting to ${uri}...`);
    });
    client.on('error', (error) => {
      console.error(`error in connection ${uri}: ${error}`);
    });
    client.on('end', () => {
      console.error(`${uri} disconnected!`);
      if (!initialized) reject(client);
      initialized = true;
    });
    return {
      client,
    };
  });
};
