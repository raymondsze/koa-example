import Router from 'koa-router';
import validator from 'validator';

// User not found error
const getUserNotFoundError = (ctx) =>
  ctx.constructError({
    status: 404,
    code: 1001,
  });

// Username already exist error
const getUserNameExistError = (ctx, value) =>
  ctx.constructError({
    status: 400,
    code: 1002,
    source: '/data/username',
    meta: { value },
  });

// Email already exist error
const getEmailExistError = (ctx, value) =>
  ctx.constructError({
    status: 400,
    code: 1003,
    source: '/data/email',
    meta: { value },
  });

// Password incorrect error
const getUserPasswordIncorrectError = (ctx) =>
  ctx.constructError({
    status: 400,
    code: 1004,
    source: '/data/password',
  });

// Email invalid error
const getUserEmailIncorrectError = (ctx, value) =>
  ctx.constructError({
    status: 400,
    code: 1005,
    source: '/data/email',
    meta: { value },
  });

// Username invalid error
const getUserNameIncorrectError = (ctx, value) =>
  ctx.constructError({
    status: 400,
    code: 1006,
    source: '/data/username',
    meta: { value },
  });

async function userRouter(app) {
  const User = app.context.database.mongo.models.User;
  const router = new Router();

  // Create User
  router.post(
    '/users',
    async (ctx, next) => {
      const data = (ctx.request.body && ctx.request.body.data) || {};
      ctx.checkBody('/data/username', true).first()
        .notBlank(ctx.constructError({
          status: 400,
          code: 1007,
          source: '/data/username',
          meta: { value: data.username },
        }))
        .match(/^[A-Za-z_][A-Za-z0-9_]{8,30}$/, ctx.constructError({
          status: 400,
          code: 1008,
          source: '/data/username',
          meta: { value: data.username },
        }));

      ctx.checkBody('/data/email', true).first()
        .notBlank(ctx.constructError({
          status: 400,
          code: 1009,
          source: '/data/email',
          meta: { value: data.email },
        }))
        .isEmail(ctx.constructError({
          status: 400,
          code: 1010,
          source: '/data/email',
          meta: { value: data.email },
        }));

      ctx.checkBody('/data/password', true).first()
        .notBlank(ctx.constructError({
          status: 400,
          code: 1011,
          source: '/data/password',
        }))
        .match(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[$@$!%*#?&])[A-Za-z\d$@$!%*#?&]{8,}$/,
          ctx.constructError({
            status: 400,
            code: 1012,
            source: '/data/password',
          }));
      if (ctx.errors) ctx.throwErrors(400, ctx.errors);
      await next();
    },
    async (ctx) => {
      const context = ctx;
      const { request } = ctx;
      const data = request.body.data;
      // get the mongo model User
      const modelByUsername = await User.findOne({ username: data.username });
      const modelByEmail = await User.findOne({ email: data.email });
      if (modelByUsername) {
        throw getUserNameExistError(ctx, data.username);
      }
      if (modelByEmail) {
        throw getEmailExistError(ctx, data.email);
      }

      const user = await User.create(data);
      context.status = 201;
      context.writeBodyData(user);
    });

  // Get Users
  router.get('/users', async (ctx) => {
    const context = ctx;
    const { where = {}, sort = {}, skip = 0, limit = 20 } = ctx.request.query;
    const users = await User.find(where)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();
    context.status = 200;
    context.writeBodyData(users);
  });

  // Get User with id
  router.get('/users/:id', async (ctx) => {
    const context = ctx;
    const user = await User.findById(context.params.id);
    if (!user) {
      throw getUserNotFoundError(ctx, context.params.id);
    }
    context.status = 200;
    context.writeBodyData(user);
  });

  // Login
  router.post('/users/login', async (ctx) => {
    const data = (ctx.request.body && ctx.request.body.data) || {};
    const context = ctx;
    let user = null;
    const { usernameOrEmail, password } = data;
    if (validator.isEmail(usernameOrEmail)) {
      user = await User.findOne({ email: usernameOrEmail });
      if (!user) {
        throw getUserEmailIncorrectError(ctx, usernameOrEmail);
      }
    } else {
      user = await User.findOne({ username: usernameOrEmail });
      if (!user) {
        throw getUserNameIncorrectError(ctx, usernameOrEmail);
      }
    }
    const match = await user.comparePassword(password);
    if (match) {
      const tokenBody = await ctx.signToken(user);
      context.status = 200;
      context.writeBodyData(tokenBody);
    } else {
      throw getUserPasswordIncorrectError(ctx, password);
    }
  });

  // Logout
  router.post('/users/logout', async (ctx) => {
    await ctx.revokeToken();
  });

  app.use(router.routes());
}

export default userRouter;
