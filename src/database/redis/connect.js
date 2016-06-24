import redis from 'redis';
import Promise from 'bluebird';
import logger from '../../logger';
import config from '../../../config';
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
  const client = redis.createClient(config.database.redis);
  client.on('ready', () => {
    logger.info(`${uri} connected!`);
  });
  client.on('connect', () => {
    logger.info(`connecting to ${uri}...`);
  });
  client.on('reconnecting', () => {
    logger.info(`reconnecting to ${uri}...`);
  });
  client.on('error', (error) => {
    logger.error(`error in connection ${uri}: ${error}`);
  });
  client.on('end', () => {
    logger.error(`${uri} disconnected!`);
  });
  return {
    client,
  };
};
