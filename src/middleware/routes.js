import applyRouters from '../routers';

/**
 * apply all routes in ../routers
 * @param  {Koa} app           - the koa server instance
 * @return {Koa}               - the koa server instance
 */
async function applyRoutesMiddleware(app) {
  await applyRouters(app);
  return app;
}

export default applyRoutesMiddleware;
