import applyHealthRoute from './health';
import applyUserRoute from './user';
export default async (app) => {
  applyHealthRoute(app);
  applyUserRoute(app);
  return app;
};
