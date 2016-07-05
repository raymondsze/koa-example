import _ from 'lodash';
import invariant from 'invariant';
import connectMongo from './mongo';
import connectRedis from './redis';

export default async (app) => {
  invariant(_.isFunction(app.connectDatabase),
    'app.connectDatabase must be function, it is required before connecting any database.');
  // ignore disabled database
  {
    const { client, models } = await connectMongo(app);
    app.connectDatabase('mongo', client, models);
  }
  {
    const { client } = await connectRedis(app);
    app.connectDatabase('redis', client);
  }
  return app;
};
