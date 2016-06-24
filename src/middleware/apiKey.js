import config from '../../config';

/**
 * check api secret in every request
 * @param  {Koa} app         - the koa server instance
 * @return {Koa}             - the koa server instance
 */
async function applyApiKeyMiddleware(app) {
  app.use(async (ctx, next) => {
    const apiKey = ctx.get('x-api-key');
    // if header not found, just throw a 400 error
    if (!apiKey) {
      throw ctx.constructError({
        status: 400,
        detail: 'X-API-KEY must be defined in the request header.',
      });
    }
    // if header found but not match, throw 403 error
    if (apiKey !== config.api.secretOrKey) {
      throw ctx.constructError({
        status: 403,
        detail: 'X-API-KEY is incorrect, it is unauthorized to process.',
      });
    }
    await next();
  });
}

applyApiKeyMiddleware.priority = 30;
applyApiKeyMiddleware.disabled = false;
export default applyApiKeyMiddleware;
