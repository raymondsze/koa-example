import convert from 'koa-convert';
import bodyParser from 'koa-body';

/**
 * apply to body parser, enable the json format, multpart, url-encoded body
 * @param  {Koa} app         - the koa server instance
 * @return {Koa}             - the koa server instance
 */
async function applyBodyParserMiddleware(app) {
  // to enable koa req capture body with json format if the request type is
  // application/url-encoded or json
  // also support file upload (multipart)
  app.use(convert(bodyParser({
    multipart: true,
    formidable: {
      keepExtensions: true,
    },
  })));
}

applyBodyParserMiddleware.priority = 12;
applyBodyParserMiddleware.disabled = false;
export default applyBodyParserMiddleware;
