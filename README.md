<h4>This project is a starter for <b>Koa@2.0</b> with the many usual middlewares pre-defined.</h4>  
<h3>Highlight:</h3>  
1. <b>ES7 syntax with babel compiler.</b>  
2. <b>Koa@2.0, fully utilize async await instead of callback hell.</b>  
3. <b>JSON request and response standard.</b>  
4. <b>Logger with winston and morgan standard.</b>  

<h3>Suggested reading for beginner of ES6/7</h3>
<a href="http://es6.ruanyifeng.com/">http://es6.ruanyifeng.com</a>
(Please ignore the Symbol parts, as babel cannot mock its features, only MicrosoftEdge support it well)  

<h3>Koa2 vs Koa vs Express</h3>
Koa2: 
`
 app.use(async (ctx, next) => {
   // here the next is same as express's next
   // ctx.request = express's req
   // ctx.response = express's res
   // ctx.req = node's req
   // ctx.res = node's req
   // ctx.body= ... = res.send(...) or ctx.response.send(...)
   // ctx.status= ... = res.status(...) or ctx.response.status(...)
   ctx.status = 200;
   ctx.body = 'OK';
 });
`
Koa:  
`
 app.use(function* (next) {
   // here the next is same as express's next
   // this.request = express's req
   // this.response = express's res
   // this.req = node's req
   // this.res = node's req
   // this.body= ... = res.send(...) or ctx.response.send(...)
   // this.status= ... = res.status(...) or ctx.response.status(...)
   this.status = 200;
   this.body = 'OK';
 });
`
Express:
`
 app.use((req, res, next) => {
   res.status(200).send('OK');
 });
`
Knowing this, you would be able to switch among Koa2, Koa and Express 's middleware by code modification.

<h3>How to start the project</h3>  
(Please make sure you started mongo and redis, and change the config as you need)
look at the config folder for reference
1. git clone
2. npm install
3. npm run start

<h3>How to test the project with mocha</h3>
1. npm run test  
(Now have no test to run)

<h3>Questions</h3>  
<b>1. How to add database client and models?</b>  
Please look at <b>src/database/mongo/connect.js</b> and <b>src/database/index.js</b>.

You need to provide an async function which return the followings  
`{ client: ..., models: ... }`  
  1. client is the client object like 'mongoose'  
  2. models is a list of model object like model created by mongoose.Schema  
Then you can access  
  1. database client by `ctx.database.mongo.client`  
  2. database models by `ctx.database.mongo.models`  

How this works?  
Please look at <b>src/middleware/database.js</b>  

<b>2. How the winston logger works?</b>  
Please look at <b>src/logger/logger.js</b>.  
That file is the winston logger with configuration, console.* is overriden in this file  
The benefit to override the console.* is  
  1. All console log must use console.*,  
    we can make sure any runtime error or third party library error  
    must log into conolse via winston level control  
  2. We can simply use console.* to log for app level log.  

<b>3. How the morgan logger works?</b>  
Please look at <b>src/middlewares/logger.js</b>.  
That file registers some functions to ctx that log the morgan message as prefix  
As usual as console.*  
`
ctx.log  
ctx.error  
ctx.debug  
ctx.warn  
ctx.info  
`  
Please use them for request level log, since it will log the request id as well.  

<b>4. How JSONAPI works?</b>  
Please look at <b>src/middlewares/jsonapi.js</b>  
We make the request, response standard for json request.  
Request Body  
`{  
  data: ?any,  
  meta: ?any,  
}`  
Response Body  
`{  
  data: ?any,  
  errors: [{status, code, ?source, ?detail, ?meta}, ...],  
  meta: {request_id, request_method, request_url, ...},  
}`  
So we created some utilities to ctx and validation.  
In the jsonapi middleware, we will do the following,  
  1. checked whether it is application/json  
  2. invalidate if there are keys other than data, meta in body  
  3. route  
  4. auto append the meta (request_id (from x-request-id), request_method, request_url) into res body.  

*: Runtime error will be wrapped as errors: [...], like  
`errors: [{  
  status: 500,  
  code: 500,  
  detail: 'System encoutered error, please contact .....',  
}]`  

*: To throw error during route, some helpers are added.  
    `ctx.constructError({ status, code, detail, source, meta })`  
      it return a error object, for example: ctx.constructError(400, 1000, 'hello', '/data', {})  
      will becomes  
`{  
    status: 400,  
    code: 1000,  
    detail: 'hello',  
    source: {  
      pointer: '/data',  
    },  
    meta: {},  
}`  
      as it is error object, you can directly throw it, the middleware will wrap it as errors: [...].  
    `ctx.throwError(status, { code, detail, source, meta })`  
      same as ctx.constructError, but throw the single error directly, the middleware will wrap it as errors: [...].  
    `ctx.throwErrors(status, errors)`  
      throw multiple errors, the errors parameter must be a list of errors consturcted by ctx.constructError.  
    `ctx.writeBodyData(data)`  
      shorthand to write data to ctx.body.data.  
    `ctx.writeBodyMeta(meta)`  
      shorthand to write meta to ctx.body.meta.  
    `ctx.data`  
      shorthand to ctx.body.data  
    `ctx.meta`  
      shorthand to ctx.body.meta  
    `ctx.skipJSONAPI()`
      this is to skip json middleware effects, normally could be used for proxy call to other server and you want to preserve the response  
<b>5. What middlewares it provide?</b>
  1. Database  
       `ctx.database.*.client`: @see question 1  
       `ctx.database.*.models`: @see question 1  
  2. Constant  
       `ctx.SERVER_PATH`: The server path  
  3. Session (enable cookies, session with secret) (`Removed, API server should not take care of session`)  
  4. BodyParser (multipart, json, url-encoded)  
  5. Helmet  
  6. Validate (port koa-validate to koa@2.0)  
       `ctx.checkBody`  
       `ctx.checkParams`  
       `ctx.checkQuery`  
       `ctx.checkFile`  
       `ctx.checkHeaders`  
  7. Request Id  
       `ctx.id`: The generated request id (uuid)  
       `ctx.req.id`: The generated request id (uuid)  
       (Request id will be logged with ctx.log, ctx.info, ...,   
        If X-Request-Id exists in request header, it will be logged as well)  
  8. Logger  
       `ctx.log`: @see question 3  
       `ctx.info`: @see question 3  
       `ctx.debug`: @see question 3  
       `ctx.error`: @see question 3  
       `ctx.warn`: @see question 3  
  9. JSONAPI  
       `ctx.constructError({ status, code, detail, source, meta })`  
       `ctx.throwError(status, { code, detail, source, meta })`  
       `ctx.throwErrors(status, errors)`  
       `ctx.writeBodyData(data)`  
       `ctx.writeBodyMeta(meta)`  
       `ctx.data`  
       `ctx.meta`  
       `ctx.skipJSONAPI()`  

<b>6. Passport Authentication?</b>  
This project use JWT strategy, and it is a middleware.  
Some helper function is added to ctx.  
  `ctx.signToken(user)` return { token_type, access_token }  
  `ctx.revokeToken()` return true/false  
  `ctx.token()` return { token_type, access_token }  
  `ctx.user` return the user object  
  `ctx.isAuthenticated()` @see passport  
  `ctx.isUnauthenticated()` @see passport 
And  
  `app.ensureAuthenticated()` middleware for checking if logined.   

<b>7. What can I play with this project?</b>  
`
GET /health        : check health status, should return OK.  
GET /secure        : required login, same as /health.  
GET /users         : get all the users  
GET /users/:id     : get user by id  
POST /users/login  : login user  
POST /users/logout : logout user  
POST /users        : create user [body: { data: { username, email, password } }]
`

<h4>TODO</h4>  
`TODO: add X-User-ID, X-Request-Id, X-Client-Id checking middleware for incoming request`