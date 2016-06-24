import _ from 'lodash';
import { getStatusText as httpStatus } from 'http-status-codes';
import invariant from 'invariant';

/**
 * Extendable error, copied from http://stackoverflow.com/questions/31089801/extending-error-in-javascript-with-es6-syntax
 */
class ExtendableError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error(message)).stack;
    }
  }
}

/**
 * JSON error, somehow follow jsonapi standard
 */
class JSONError extends ExtendableError {
  constructor({ status, code, detail, source, meta }) {
    super(httpStatus(status));
    invariant(status && _.isNumber(status),
      `status must be a number and required but found ${status}.`);
    invariant(!code || _.isNumber(code),
      `code must be a number but found ${code}.`);
    invariant(!detail || _.isString(detail),
      `detail must be a string but found: ${detail}`);
    invariant(!source || _.isString(source),
      `source must be a string but found: ${source}`);
    invariant(!meta || _.isObject(meta),
      `meta must be an object but found: ${source}`);
    this.status = status;
    this.status_code = code || status;
    this.title = this.message;
    this.detail = detail || this.title;
    // here source should be a json path
    if (source) this.source = { pointer: source };
    if (meta) this.meta = meta;
  }

  toJSON() {
    const { status, status_code, title, detail, source, meta } = this;
    return { status, status_code, title, detail, source, meta };
  }
}

/**
 * Validation error wrapper, somehow follow jsonapi standard
 */
class JSONErrors extends ExtendableError {
  constructor(status, errors = []) {
    super(httpStatus(status));
    invariant(status && _.isNumber(status),
      `status must be a number and required but found ${status}.`);
    invariant(!_.isUndefined(errors) || _.isArray(errors),
      `errors must be an array of validtion error but found: ${errors}.`);
    invariant(_.isUndefined(_.find(errors, error => !(error instanceof JSONError))),
      `errors must be an array of validtion error but found: ${errors}.`);
    this.errors = errors;
    this.status = status;
  }

  toJSON() {
    return { errors: this.errors };
  }
}

/**
 * given response, check if it is json header
 *
 * @param  {Koa.Response} response      - the koa response obect
 * @return {boolean}                    - is json or not
 */
function isJSON(response) {
  const contentType = response.get('content-type');
  return !!(!contentType || contentType.match(/json;? .+/)
    || contentType.match(/application\/json;? .+/));
}

/**
 * get the meta for response
 *
 * @param  {Koa.Context} ctx            - the koa context
 * @return {Object}                     - the response meta
 */
function getMeta(ctx) {
  if (isJSON(ctx.response)) {
    return {
      ... ctx.body ? ctx.body.meta : {},
      request_id: ctx.get('x-request-id'),
      request_method: ctx.method,
      request_url: ctx.url,
    };
  }
  return {};
}

async function applyRequestMiddleware(app) {
  // add errors utilities
  Object.assign(app.context, {
    constructError: ({ status = 400, code = 500, title = '', detail = '', source, meta }) =>
        new JSONError({ status, code, title, detail, source, meta }),
    concatErrors: (status, errors = []) => new JSONErrors(status, errors),
  });

  // Response handler
  app.use(async (ctx, next) => {
    const context = ctx;
    try {
      // wait the route
      await next();
      // status with 400 to 500 is regards as errors
      if (ctx.status >= 400 && ctx.status <= 599) {
        // throw the error to make it go catch block
        throw new JSONErrors(ctx.status, [
          new JSONError({
            status: ctx.status,
          }),
        ]);
      }
    } catch (err) {
      console.error(err.stack.toString());
      if (err instanceof JSONErrors) {
        // if validaition error, its status code is 400
        // its body is json format of error
        context.status = err.status;
        context.body = err.toJSON();
      } else if (err instanceof JSONError) {
        // if validaition error, its status code is 400
        // wrap error to errors
        context.status = err.status;
        context.body = new JSONErrors(context.status, [err]).toJSON();
      } else {
        // internal server error
        const { status = 500, message } = err;
        const error = {
          status,
          status_code: status,
          title: httpStatus(status),
          detail: message || 'Server encoutered error, please contact system adminstrator.',
        };
        context.status = error.status;
        context.body = { errors: [error] };
      }
    } finally {
      if (isJSON(ctx.response)) {
        context.status = ctx.status;
        context.body = ctx.body || {};
        context.body.meta = getMeta(ctx);
      }
    }
  });
}

applyRequestMiddleware.priority = 21;
applyRequestMiddleware.disabled = false;
export default applyRequestMiddleware;
