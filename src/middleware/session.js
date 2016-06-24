import session from 'koa-session';
import convert from 'koa-convert';
import config from '../../config';

/**
 * enable session, cookie support
 * @param  {Koa} app         - the koa server instance
 * @return {Koa}             - the koa server instance
 */
async function applySessionMiddleware(app) {
  // to enable koa req capture cookie as session
  Object.assign(app, {
    keys: [config.session.secretOrKey],
  });
  app.use(convert(session(app)));
  return app;
}

applySessionMiddleware.priority = 11;
applySessionMiddleware.disabled = false;
export default applySessionMiddleware;
