import Koa from 'koa';
import applyMiddleware from './middleware';
import config from '../config';

// start the server asynchronously
export default (async () => {
  const serverConfig = config.server;
  const app = new Koa();
  await applyMiddleware(app);
  return new Promise((resolve, reject) => {
    app.listen(serverConfig.port, serverConfig.host, (err) => {
      if (err) {
        console.error(err);
        reject(err);
      }
      console.info(`Server started at http://${serverConfig.host}:${serverConfig.port}`);
      resolve(app);
    });
  });
})();
