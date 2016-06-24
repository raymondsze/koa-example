import aguid from 'aguid';

/**
 * add request id to context and req
 * @param  {Koa} app            - the koa server instance
 * @return {Koa} app            - the koa server instance
 */
async function applyRequestIdMiddleware(app) {
  app.use(async (ctx, next) => {
    const context = ctx;
    // generate server side unique request id
    context.id = context.req.id = aguid();
    await next();
  });
  return app;
}

applyRequestIdMiddleware.priority = 10;
applyRequestIdMiddleware.disabled = false;
export default applyRequestIdMiddleware;
