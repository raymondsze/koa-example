import validate, { Validator, FileValidator } from 'koa-validate';

/**
 * request validator
 * @param  {Koa} app         - the koa server instance
 * @return {Koa}             - the koa server instance
 */
async function applyValidatorMiddleware(app) {
  // overwrite the add error function to make it fit our need
  // we need array of error object instead of nested error object with key inside an array
  Validator.prototype.addError = function addError(tip) {
    this.goOn = false;
    if (this.value && this instanceof FileValidator) {
      this.value.goOn = false;
    }
    if (!this.context.errors) {
      this.context.errors = [];
    }
    this.context.errors.push(tip);
  };
  // here will add checkBody, checkQuery, etc utils to ctx
  validate(app);
  const { checkBody, checkQuery, checkParams, checkFile, checkHeader } = app.context;
  Object.assign(app.context, {
    checkBody: function ctxCheckBody(...args) {
      return checkBody.apply(this, args);
    },
    checkQuery: function ctxCheckQuery(...args) {
      return checkQuery.apply(this, args);
    },
    checkParams: function ctxCheckParams(...args) {
      return checkParams.apply(this, args);
    },
    checkFile: function ctxCheckFile(...args) {
      return checkFile.apply(this, args);
    },
    checkHeader: function ctxCheckHeader(...args) {
      return checkHeader.apply(this, args);
    },
  });
  return app;
}

export default applyValidatorMiddleware;
