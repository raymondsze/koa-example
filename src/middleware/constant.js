import config from '../../config';

/**
 * inject constants to app context
 * @param  {Koa} app           - the koa server instance
 * @return {Koa}               - the koa server instance
 */
async function applyConstantMiddleware(app) {
  const { server } = config;
  Object.assign(app.context, {
    SERVER_PATH: `http://${server.host}:${server.port}`,
  });
  return app;
}

export default applyConstantMiddleware;
