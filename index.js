const serverless = require('serverless-http');
const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const koaBody = require('koa-body');
const cors = require('@koa/cors');
const convert = require('koa-convert');
const jwt = require('./middlewares/jwt');

const {
  setupgroupID,
  getGiftIdeas,
  addGiftIdeas,
  addExclusions,
  drawNames,
  getSecretSanta
} = require('./controller/secretSanta');

const { login } = require('./controller/auth');

const app = new Koa();

const whitelist = process.env.WHITELIST.split(',');

const checkOriginAgainstWhitelist = (ctx) => {
  const requestOrigin = ctx.accept.headers.origin;
  if (!whitelist.includes(requestOrigin)) {
    return ctx.throw(`🙈 ${requestOrigin} is not a valid origin`);
  }
  return requestOrigin;
};

app.use(convert(cors({ origin: checkOriginAgainstWhitelist })));
app.use(koaBody());
app.use(bodyParser());

const router = new Router();
router.get('/api', (ctx) => {
  ctx.body = JSON.stringify({ message: 'Welcome to secretSanta api' });
});

router.post('/api/user/login', login);
router.post('/api/secretsanta/setup/:groupID', jwt, setupgroupID);
router.get('/api/secretsanta/draw/:groupID', jwt, drawNames);
router.get('/api/secretsanta/reveal/:memberName/:groupID', jwt, getSecretSanta);
router.get('/api/secretsanta/giftIdeas/:memberName/:groupID', jwt, getGiftIdeas);
router.put('/api/secretsanta/giftIdeas/:memberName/:groupID', jwt, addGiftIdeas);
router.put('/api/secretsanta/exclusions/:memberName/:groupID', jwt, addExclusions);

app.on('error', (err) => {
  console.log('server error', err);
});

app.use(router.routes());

module.exports.handler = serverless(app);
