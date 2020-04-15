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
  getSecretSanta,
  getAllGroups,
  removeGroup,
  sendEmailToMembers,
  sendEmailToMember,
  getMembersFromGroup,
  setGiftIdeasLastUpdated
} = require('./handlers/secretSanta');

const { login } = require('./handlers/auth');

const app = new Koa();

const checkOriginAgainstWhitelist = (ctx) => {
  const whitelist = process.env.WHITELIST
    ? process.env.WHITELIST.split(',')
    : [];

  const requestOrigin = ctx.accept.headers.origin;
  if (!whitelist.includes(requestOrigin)) {
    return ctx.throw(`🙈 ${requestOrigin} is not a valid origin`);
  }
  return requestOrigin;
};

app.use(convert(cors({ origin: checkOriginAgainstWhitelist })));
app.use(koaBody());
app.use(bodyParser({ enableTypes: ['json'] }));

const router = new Router();
router.get('/api', (ctx) => {
  ctx.body = JSON.stringify({ message: 'Welcome to secretSanta api' });
});

router.post('/api/user/login', login);
router.post('/api/secretsanta/setup/:groupID', jwt, setupgroupID);
router.get('/api/secretsanta/draw/:groupID', jwt, drawNames);
router.get('/api/secretsanta/admin/allgroups', jwt, getAllGroups);
router.get('/api/secretsanta/admin/sendEmail/:groupID/:memberName', jwt, sendEmailToMember);
router.get('/api/secretsanta/admin/sendEmail/:groupID', jwt, sendEmailToMembers);
router.get('/api/secretsanta/reveal/:memberName/:groupID', jwt, getSecretSanta);
router.get('/api/secretsanta/giftIdeas/:memberName/:groupID', jwt, getGiftIdeas);
router.put('/api/secretsanta/giftIdeas/:memberName/:groupID/updated', jwt, setGiftIdeasLastUpdated);
router.put('/api/secretsanta/giftIdeas/:memberName/:groupID', jwt, addGiftIdeas);
router.put('/api/secretsanta/exclusions/:memberName/:groupID', jwt, addExclusions);
router.get('/api/secretsanta/:groupID', jwt, getMembersFromGroup);
router.delete('/api/secretsanta/:groupID', jwt, removeGroup);

app.on('error', (err, ctx) => {
  console.log('server error', err, ctx);
});

app.use(router.routes());

module.exports = app;
