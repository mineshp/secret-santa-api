const serverless = require('serverless-http');
const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const koaBody = require('koa-body');
const cors = require('@koa/cors');
const convert = require('koa-convert');

const {
  setupgroupID,
  addGiftIdeas,
  addExclusions,
  drawNames,
  getSecretSanta
} = require('./controller/secretSanta');

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

router.post('/api/secretsanta/setup/:groupID', setupgroupID);
router.get('/api/secretsanta/draw/:groupID', drawNames);
router.get('/api/secretsanta/reveal/:memberName/:groupID', getSecretSanta);
router.put('/api/secretsanta/giftIdeas/:memberName/:groupID', addGiftIdeas);
router.put('/api/secretsanta/exclusions/:memberName/:groupID', addExclusions);

app.on('error', (err) => {
  console.log('server error', err);
});

app.use(router.routes());

module.exports.handler = serverless(app);
