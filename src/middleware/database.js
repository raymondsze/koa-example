import _ from 'lodash';
import invariant from 'invariant';
import connectDatabase from '../database';

/**
 * add util to connect database
 * the database client will be stored in ctx.database[name].client
 * the database models will be stored in ctx.database[name].models
 * @param  {Koa} app           - the koa server instance
 * @return {Koa}               - the koa server instance
 */
async function applyDatabaseMiddleware(app) {
  Object.assign(app, {
    connectDatabase: (name, client, models) => {
      invariant(name && _.isString(name),
        `database connector name must be string but found: ${name}`);
      invariant(_.isObject(client),
        `database client ${name} must be an object but found ${client}`);
      invariant(!models || _.isObject(models),
        `database models must be an object but found ${models}`);
      Object.assign(app.context, {
        database: {
          ... app.context.database,
          [name]: {
            client,
            models,
          },
        },
      });
      return client;
    },
  });
  // connect all database
  await connectDatabase(app);
  return app;
}

applyDatabaseMiddleware.priority = 0;
applyDatabaseMiddleware.disabled = false;
export default applyDatabaseMiddleware;
