import http from 'http';
import Koa from 'koa';
import _ from 'lodash';
import invariant from 'invariant';
import applyMiddleware from './middleware';
import config from '../config';

invariant(_.isPlainObject(config.server),
  `config.server must be plain object but found ${config.server}`);
invariant(_.isString(config.server.host),
  `config.server.host must be string but found ${config.server.host}`);
invariant(_.isNumber(config.server.port),
  `config.server.port must be number but found ${config.server.port}`);

// start the server asynchronously
export default (async () => {
  const { port, host } = config.server;
  const app = new Koa();
  await applyMiddleware(app);
  return new Promise((resolve, reject) => {
    const callback = app.callback();
    const server = http.createServer(callback)
      .listen(port, host, (err) => {
        if (err) {
          console.error(err);
          reject(err);
        }
        console.info(`Server started at http://${host}:${port}`);
      });
    resolve(server);
  });
})();
