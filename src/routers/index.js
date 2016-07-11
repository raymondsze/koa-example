import applyHealthRoute from './health';
import applyUserRoute from './user';
export default async (app) => {
  await applyHealthRoute(app);
  await applyUserRoute(app);
  return app;
};
