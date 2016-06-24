import Promise from 'bluebird';
import _ from 'lodash';
import importDirectory from '../lib/importDirectory';

// auto read current folders and apply all the middlewares automatically
export default async (app) => {
  // sort middlewares by priority, since middlewares could have dependencies
  let applyMiddlewares = importDirectory(module);
  // grab index (it mean folder structure) if exists
  applyMiddlewares = _.map(applyMiddlewares,
    applyMiddleware => applyMiddleware.index || applyMiddleware);
  // ignore disabled middleware
  applyMiddlewares = _.filter(applyMiddlewares,
    applyMiddleware => _.isFunction(applyMiddleware) && !applyMiddleware.disabled);
  // sort by priority
  applyMiddlewares = _.sortBy(applyMiddlewares,
    applyMiddleware => applyMiddleware.priority);
  // apply all middleware
  await Promise.mapSeries(applyMiddlewares, async applyMiddleware => applyMiddleware(app));
  return app;
};
