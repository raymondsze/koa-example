import moment from 'moment';
import ms from 'ms';
import jwt from 'jsonwebtoken';
import aguid from 'aguid';
import passport from 'koa-passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import config from '../../config';

/**
 * apply auth middleware (passport)
 * app.ensureAuthenticated is the middleware could be used to ensure user is logined.
 * ctx.signToken(user) is the util to sign an accessToken
 * ctx.revokeToken(ctx) is the util to revoke an accessToken
 * ctx.token() is the util to get an accessToken { token_type, access_token }
 * @param  {Koa} app          - the koa server instance
 * @return {Koa}              - the koa server instance
 */
async function applyAuthMiddleware(app) {
  // access the redisClient
  const database = app.context.database;
  const redis = database.redis.client;

  // passport
  // jwt options
  const opts = {
    ...config.jwt,
    jwtFromRequest: ExtractJwt.fromAuthHeader(),
    passReqToCallback: true,
  };
  // use jwt strategy to authenticate users
  passport.use(
    new JwtStrategy(opts, (req, payload, done) => {
      const sessionId = payload.id;
      redis.hgetallAsync(sessionId)
        .then(session => {
          if (session.valid) done(null, JSON.parse(session.user));
          else done(null, false);
        })
        .catch(err => {
          done(err, false);
        });
    })
  );
  app.use(passport.initialize());
  /*
    passport-session
    app.use(passport.session());
    passport.serializeUser((user, done) => {
    });
    passport.deserializeUser((id, done) => {
    });
  */
  // authenticate for all endpoint
  app.use(async (ctx, next) =>
    passport.authenticate('jwt', { session: false }, (user) => {
      if (user === false) return next();
      // set the req.user to make req.isAuthenticated = true
      return ctx.login(user, { session: false })
        .then(next)
        .catch(e => {
          console.error(e.stack);
          ctx.error(e);
          return next();
        });
    })(ctx, next)
  );

  // add requireLogin util to app, could be used as middleware
  Object.assign(app, {
    ensureAuthenticated: async (ctx, next) => {
      if (ctx.isUnauthenticated()) {
        throw ctx.constructError({
          status: 403,
          detail: 'User is unauthorized to do this action.',
        });
      }
      await next();
    },
  });

  Object.assign(app.context, {
    signToken: async (user) => {
      const {
        secretOrKey, algorithm, issuer, audience,
        accessToken: at,
      } = config.jwt;
      const atOpts = {
        algorithm,
        issuer,
        audience,
        expiresIn: at.expiresIn,
      };
      // we need to sign the token and store in redis here
      const session = {
        // the random session id
        id: aguid(),
        // the user id
        user_id: user._id.toString(),
        // the user object, note that the redis only support String, Buffer and Number
        user: JSON.stringify(user),
        // indicate this session is valid or not, should set to false when logout
        valid: 1,
        // expire date
        expiresAt: moment(Date.now() + ms(atOpts.expiresIn)).utc().format(),
      };
      const accessToken = jwt.sign(session, secretOrKey, atOpts);
      await redis.hmsetAsync(session.id, session);
      await redis.expireAsync(session.id, Math.floor(ms(atOpts.expiresIn) / 1000));
      return { token_type: 'JWT', access_token: accessToken };
    },
    revokeToken: async (ctx) => {
      const token = ExtractJwt.fromAuthHeader(ctx.req);
      await redis.hsetAsync(token, 'valid', 0);
      return true;
    },
    token: (ctx) => {
      const token = ExtractJwt.fromAuthHeader(ctx.req);
      return { token_type: 'JWT', access_token: token };
    },
  });
}

applyAuthMiddleware.priority = 20;
applyAuthMiddleware.disabled = false;
export default applyAuthMiddleware;
