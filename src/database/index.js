import Promise from 'bluebird';
import _ from 'lodash';
import invariant from 'invariant';
import importDirectory from '../lib/importDirectory';

export default async (app) => {
  invariant(_.isFunction(app.connectDatabase),
    'app.connectDatabase must be function, it is required before connecting any database.');
  let connectDatabases = importDirectory(module);
  // grab index (it mean folder structure) if exists
  connectDatabases = _.map(connectDatabases,
    (connectDatabase, name) => {
      const connect = connectDatabase.index || connectDatabase;
      if (_.isFunction(connect)) connect.dbName = name;
      return connect;
    });
  // ignore disabled database
  await Promise.each(connectDatabases, async (connectDatabase) => {
    if (_.isFunction(connectDatabase) && !connectDatabase.disabled) {
      const { dbName } = connectDatabase;
      const { client, models } = await connectDatabase(app);
      return app.connectDatabase(dbName, client, models);
    }
    return null;
  });
  return app;
};
