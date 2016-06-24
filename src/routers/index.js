import Promise from 'bluebird';
import _ from 'lodash';
import importDirectory from '../lib/importDirectory';

export default async (app) => {
  let applyRoutes = importDirectory(module);
  // grab index (it mean folder structure) if exists
  applyRoutes = _.map(applyRoutes,
    applyRoute => applyRoute.index || applyRoute);
  // ignore disabled router
  applyRoutes = _.filter(applyRoutes,
    applyRoute => _.isFunction(applyRoute) && !applyRoute.disabled);
  // apply router
  await Promise.map(applyRoutes, async applyRoute => applyRoute(app));
  return app;
};
