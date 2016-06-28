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
  app.use(async (ctx, next) => {
    const context = ctx;
    // convert koa-validate to koa2 style
    context.checkBody = (...args) => app.context.checkBody.apply(context, args);
    context.checkQuery = (...args) => app.context.checkQuery.apply(context, args);
    context.checkParams = (...args) => app.context.checkParams.apply(context, args);
    context.checkFile = (...args) => app.context.checkFile.apply(context, args);
    context.checkHeader = (...args) => app.context.checkHeader.apply(context, args);
    await next();
  });
  return app;
}

applyValidatorMiddleware.priority = 14;
applyValidatorMiddleware.disabled = false;
export default applyValidatorMiddleware;
