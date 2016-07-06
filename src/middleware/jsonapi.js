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
    this.code = code || status;
    this.title = this.message;
    this.detail = detail || this.title;
    // here source should be a json path
    if (source) this.source = { pointer: source };
    if (meta) this.meta = meta;
  }

  toJSON() {
    const { status, code, title, detail, source, meta } = this;
    return { status, code, title, detail, source, meta };
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
 * @param  {Koa.Context} ctx            - the koa context
 * @return {boolean}                    - is json or not
 */
function isJSONResponse(ctx) {
  const contentType = ctx.response.get('content-type');
  return !!(!contentType || contentType.match(/json;? .+/)
    || contentType.match(/application\/json;? .+/));
}

/**
 * given response, check if it is json header
 *
 * @param  {Koa.Context} ctx            - the koa context
 * @return {boolean}                    - is json or not
 */
function isJSONRequest(ctx) {
  const contentType = ctx.get('content-type');
  return !!(!contentType || contentType.match(/json;?.*/)
    || contentType.match(/application\/json;?.*/));
}

/**
 * get the meta for response
 *
 * @param  {Koa.Context} ctx            - the koa context
 * @return {Object}                     - the response meta
 */
function getMeta(ctx) {
  if (isJSONResponse(ctx)) {
    return {
      ... ctx.body ? ctx.body.meta : {},
      request_id: ctx.get('x-request-id'),
      request_method: ctx.method,
      request_url: ctx.url,
    };
  }
  return {};
}

async function applyJSONAPIMiddleware(app) {
  // add errors utilities
  Object.assign(app.context, {
    // call this if you don't want this middleware take effect on your response
    // should be used for proxy call
    skipJSONAPI: function skipJSONAPI() {
      this.__skip__ = true;
    },
    // get error, could be used if multiple errors
    constructError: function error(props) {
      return new JSONError(props);
    },
    // throw error, it would be handled by outter scope
    throwError: function throwError(status, props) {
      throw new JSONError({ ...props, status });
    },
    // throw errors, it would be handled by outter scope
    throwErrors: function writeErrors(status, errors) {
      throw new JSONErrors(status, errors);
    },
    // write data to response.body.data
    writeBodyData: function writeBodyData(data) {
      this.body = this.body || {};
      this.body.data = data;
    },
    // write meta to response.body.meta
    writeBodyMeta: function writeBodyMeta(meta) {
      this.body = this.body || {};
      this.body.meta = meta;
    },
  });

  // Response handler
  app.use(async (ctx, next) => {
    const context = ctx;
    try {
      if (!ctx.__skip__) {
        // if content-type is json, the request must have data
        if (isJSONRequest(ctx)) {
          const body = ctx.request.body;
          let invalid = false;
          if (!_.isEmpty(body) && _.isPlainObject(body)) {
            const propNames = _.keys(body);
            invalid = _.find(propNames, name => (name !== 'data' || name !== 'meta'));
          }
          // if body is invalid
          if (invalid) {
            throw new JSONError({
              status: 400,
              detail: 'Only data or meta is allowed in json request body.',
            });
          } else {
            // make easy access to body.data and body.meta
            context.data = body.data || {};
            context.meta = body.meta || {};
          }
        }
      }
      // wait the route
      await next();
      // status with 400 to 500 is regards as errors
      if (!ctx.__skip__ && ctx.status >= 400 && ctx.status <= 599) {
        // throw the error to make it go catch block
        const err = new JSONError({
          status: ctx.status,
          detail: ctx.body,
        });
        throw err;
      }
    } catch (err) {
      ctx.error(err.stack.toString());
      if (!ctx.__skip__) {
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
            code: status,
            detail: message || 'Server encoutered error, please contact system adminstrator.',
          };
          context.status = error.status;
          context.body = { errors: [error] };
        }
      }
    } finally {
      if (!ctx.__skip__) {
        // append meta
        if (isJSONResponse(ctx)) {
          context.status = ctx.status;
          context.body = ctx.body || {};
          context.body.meta = getMeta(ctx);
        }
      }
    }
  });
  return app;
}

export default applyJSONAPIMiddleware;
