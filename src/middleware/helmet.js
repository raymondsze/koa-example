import helmet from 'koa-helmet';

/**
 * helmet, security header middleware collection for koa
 * @param  {Koa} app         - the koa server instance
 * @return {Koa}             - the koa server instance
 */
async function applyHelmetMiddleware(app) {
  // Security header middleware collection for koa
  app.use(helmet());
}

export default applyHelmetMiddleware;
