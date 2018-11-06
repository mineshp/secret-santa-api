const serverless = require('serverless-http');
const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const koaBody = require('koa-body');

const {
  setupgroupID,
  addGiftIdeas,
  addExclusions,
  drawNames,
  getSecretSanta
} = require('./controller/secretSanta');

const app = new Koa();

// body parser
app.use(koaBody());
app.use(bodyParser());

const router = new Router();
router.get('/api', (ctx) => { ctx.body = 'Welcome to secretSanta api'; });

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
