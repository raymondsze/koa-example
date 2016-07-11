import http from 'http';
import Koa from 'koa';
import _ from 'lodash';
import invariant from 'invariant';
import './logger';
import applyMiddleware from './middleware';
import config from '../config';

invariant(_.isPlainObject(config.server),
  `config.server must be plain object but found ${config.server}`);
invariant(_.isString(config.server.host),
  `config.server.host must be string but found ${config.server.host}`);
invariant(_.isNumber(config.server.port),
  `config.server.port must be number but found ${config.server.port}`);

const { port, host } = config.server;

// we separate createServer and startServer since we need to expost createServer for supertest
// that not to export any port

/**
 * Create server
 * @return {Promise<{ app, server }>}   - app is the koa app, server is node server
 */
async function createServer() {
  const app = new Koa();
  await applyMiddleware(app);
  const callback = app.callback();
  const server = http.createServer(callback);
  return { app, server };
}

/**
 * Start server
 */
async function startServer() {
  try {
    const { server } = await createServer();
    server.listen(port, host, (err) => {
      if (err) {
        console.error(err);
      }
      console.info(`Server started at http://${host}:${port}`);
    });
  } catch (err) {
    console.error(err);
    console.error('Server cannot be started due to some errors.');
    if (err) process.exit();
  }
}

export { createServer, startServer };
export default startServer;
