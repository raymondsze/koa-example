import Router from 'koa-router';

async function healthRouter(app) {
  const router = new Router();
  // check the health status of server
  router.get('/health', async (ctx) => {
    Object.assign(ctx, {
      status: 200,
      body: 'OK',
    });
  });

  // secure endpoint
  router.get('/secure', app.ensureAuthenticated, async (ctx) => {
    Object.assign(ctx, {
      status: 200,
      body: 'OK',
    });
  });
  app.use(router.routes());
}

export default healthRouter;
