const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const koaBody = require('koa-body');
const cors = require('@koa/cors');
const convert = require('koa-convert');
const jwt = require('./middlewares/jwt');
const isAdmin = require('./middlewares/isAdmin');
const errorHandler = require('./middlewares/errorHandler');

const {
  addGiftIdeas,
  addExclusions,
  getGiftIdeas,
  setGiftIdeasLastUpdated,
  showRandomSantaQuotes,
} = require('./handlers/wishlist');

const {
  drawNames,
  setupgroupID,
  getAllGroups,
  removeGroup,
  sendEmailToMembers,
  sendEmailToMember,
  getMembersFromGroup,
  getSecretSanta,
  setSecretSantaRevealed,
  getSecretSantaRevealed,
} = require('./handlers/admin');

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

router.get('/api/displayQuotes', showRandomSantaQuotes);
router.get('/api/reveal/:memberName/:groupID', jwt, getSecretSanta);
router.get(
  '/api/reveal/:memberName/:groupID/status',
  jwt,
  getSecretSantaRevealed
);
router.put(
  '/api/reveal/:memberName/:groupID/status',
  jwt,
  setSecretSantaRevealed
);
router.get('/api/giftIdeas/:memberName/:groupID', jwt, getGiftIdeas);
router.put(
  '/api/giftIdeas/:memberName/:groupID/updated',
  jwt,
  setGiftIdeasLastUpdated
);
router.put('/api/giftIdeas/:memberName/:groupID', jwt, addGiftIdeas);
router.put('/api/exclusions/:memberName/:groupID', jwt, addExclusions);

// Requires admin authorisation
router.get('/api/admin/draw/:groupID', jwt, isAdmin, drawNames);
router.get('/api/admin/allgroups', jwt, isAdmin, getAllGroups);
router.get('/api/admin/sendEmail/:groupID', jwt, isAdmin, sendEmailToMembers);
router.get(
  '/api/admin/sendEmail/:groupID/:memberName',
  jwt,
  isAdmin,
  sendEmailToMember
);
router.get('/api/admin/:groupID', jwt, isAdmin, getMembersFromGroup);
router.post('/api/admin/setup/:groupID', jwt, isAdmin, setupgroupID);
router.delete('/api/admin/:groupID', jwt, isAdmin, removeGroup);

app.use(errorHandler);

// eslint-disable-next-line no-unused-vars
app.on('error', (err, ctx) => {
  console.log('API error', `${err.status}: ${err.message}`);
  // console.log('Error received', err); // Uncomment for debugging
  // console.log('Context object', ctx); // Uncomment for debugging
});

app.use(router.routes());

module.exports = app;
