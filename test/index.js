/* eslint-env node, mocha */
import request from 'supertest';
import { createServer } from '../src/server';
// Guide to write testcase
// 1. you may need some useful lib like mockgoose
// etc to mock the database connection
// 2. you may need sinon to spy function calls
// 3. you may need proxyquire to hijack require
describe('Test', () => {
  let app; // eslint-disable-line
  let server;
  before(async () => {
    const instance = await createServer();
    app = instance.app;
    // you could use app.context.database to access db instances
    server = instance.server;
  });

  it('sample', (done) => {
    request(server).get('/health').expect(200, done);
  });
});
