import _ from 'lodash';
import morgan from 'morgan';
import invariant from 'invariant';

const IS_DEV_MODE = (!process.env.NODE_ENV || process.env.NODE_ENV === 'development');
const IS_TEST_MODE = (process.env.NODE_ENV === 'test');
// customize the morgan middleware
const format = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version"' +
  ' :status :res[content-length] ":referrer" ":user-agent"' +
  ' [:req[x-request-id]] [:req-id] [:user-id]';
// custom format which is equal to ${combined} [${req.get('x-request-id')}] [${req.id}] [${user.id}]
morgan.format('custom', format);
// req.id is from the request id middleware
morgan.token('req-id', (req) => (req.id ? req.id : '-'));
// req.user is from passport middleware
morgan.token('user-id', (req) => ((req.user && req.user.id) ? req.user.id : '-'));

// log levels types
const types = ['log', 'info', 'debug', 'warn', 'error'];

/**
 * append morgan prefix to the mssage log
 * @param  {string} type              - the log level, must be log|debug|warn|error
 * @param  {Koa.Context} ctx          - the koa context
 * @param  {string} msg               - the log message
 * @param  {Array<any>} ...args       - the log arguments (replace %s)
 * @return {string}                   - the message
 */
function logMsg(type, ctx, msg, ...args) {
  invariant(_.indexOf(types, type) !== -1,
    `type must be one of [log, debug, warn, error] but found: ${type}`);
  // obtain the morgan log prefix
  let prefix = '';
  if (!IS_DEV_MODE) prefix = morgan.compile(format)(morgan, ctx.req, ctx.res);
  // this is to easier for tracking multline message due to async logging
  _.each(msg, m => console[type].apply(console, [`${prefix} ${m}`, ...args]));
}

/**
 * apply the middleware
 * @param  {Koa} app                  - the koa server instance
 * @return {Koa} app                  - the koa server instance
 */
async function applyLoggerMiddleware(app) {
  if (!IS_TEST_MODE) {
    // morgan log request and response with winston logger
    const fn = morgan('custom', { stream: { write: (message) => console.info(message) } });
    // convert morgan middleware from express to koa style
    app.use(async (ctx, next) =>
      new Promise((resolve, reject) => {
        fn(ctx.req, ctx.res, (err) => (err ? reject(err) : resolve(ctx)));
      }).then(next)
    );
  }
  // add logging utilites to context, ctx.debug, ctx.log, ctx.warn, ctx.error
  // should prevent using console[level] inside later middleware
  // as we need to preserve log style as morgan (apache common)
  Object.assign(app.context, {
    // here we only use the console util as
    // we already override the console function in winston middleware
    debug: function debug(msg, ...args) {
      return logMsg('debug', this, msg, ...args);
    },
    info: function info(msg, ...args) {
      return logMsg('info', this, msg, ...args);
    },
    log: function log(msg, ...args) {
      return logMsg('log', this, msg, ...args);
    },
    warn: function warn(msg, ...args) {
      return logMsg('warn', this, msg, ...args);
    },
    error: function error(msg, ...args) {
      return logMsg('error', this, msg, ...args);
    },
  });
  return app;
}

export default applyLoggerMiddleware;
