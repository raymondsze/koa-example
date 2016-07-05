import applyDatabaseMiddleware from './database';
import applyConstantMiddleware from './constant';
import applySessionMiddleware from './session';
import applyBodyMiddleware from './bodyParser';
import applyHelmetMiddleware from './helmet';
import applyValidateMiddleware from './validator';
import applyRequestIdMiddleware from './requestId';
import applyLoggerMiddleware from './logger';
import applyJSONAPIMiddleware from './jsonapi';
import applyAuthMiddleware from './authentication';
import applyRoutes from './routes';

// apply middlewares
export default async (app) => {
  await applyDatabaseMiddleware(app);
  await applyConstantMiddleware(app);
  await applySessionMiddleware(app);
  await applyBodyMiddleware(app);
  await applyHelmetMiddleware(app);
  await applyValidateMiddleware(app);
  await applyRequestIdMiddleware(app);
  await applyLoggerMiddleware(app);
  await applyJSONAPIMiddleware(app);
  await applyAuthMiddleware(app);
  await applyRoutes(app);
  return app;
};
