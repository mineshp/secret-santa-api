const supertest = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../../services/lambda');

/* These env variables could also be done in a setupBeforeEnv.js file
and added to jest config in package.json.
Jest-dynalite would then have to use advanced config
*/

process.env.JWT_SECRET = 'testSecret';
process.env.SECRET_SANTA_TABLE = 'secret-santa-api-local';
process.env.SEND_EMAIL_FUNCTION = 'test-email';

const app = require('../..');
const dbClient = require('../../db/dbClient');

const adminTestToken = jwt.sign(
  {
    memberName: 'rudolph',
    groupID: 'testgroup',
    email: 'test@test.com',
    admin: true,
  },
  process.env.JWT_SECRET
);

const nonAdminTestToken = jwt.sign(
  {
    memberName: 'dancer',
    groupID: 'testgroup',
    email: 'test@test.com',
    admin: false,
  },
  process.env.JWT_SECRET
);

const setupGroupForTesting = async (request) => {
  const groupNameToSetup = 'localTestGroup';
  const newGroupPayload = [
    {
      memberName: 'testUser1',
      groupID: groupNameToSetup,
      passphrase: 'test1',
    },
    {
      memberName: 'testUser2',
      groupID: groupNameToSetup,
      passphrase: 'test2',
    },
  ];

  return request
    .post(`/api/admin/setup/${groupNameToSetup}`)
    .set('Authorization', `Bearer ${adminTestToken}`)
    .send(newGroupPayload);
};

const getMember = async (memberName, groupID, fieldToReturn) =>
  dbClient.get({
    TableName: process.env.SECRET_SANTA_TABLE,
    Key: {
      memberName,
      groupID,
    },
    ProjectionExpression: fieldToReturn,
  });

describe('wishlist', () => {
  let server = {};
  let request = {};

  beforeAll((done) => {
    server = app.listen(done);
  });
  beforeEach(async () => {
    request = supertest(server);
    await setupGroupForTesting(request);
  });
  afterAll(() => {
    server.close();
  });

  it('gets giftIdeas successfully', async () => {
    await dbClient.update({
      TableName: process.env.SECRET_SANTA_TABLE,
      Key: {
        memberName: 'testUser1',
        groupID: 'localTestGroup',
      },
      UpdateExpression: 'set giftIdeas = :gi',
      ExpressionAttributeValues: {
        ':gi': ['foo', 'bar', 'baz'],
      },
    });

    const { status, text } = await request
      .get('/api/giftIdeas/testUser1/localTestGroup')
      .set('Authorization', `Bearer ${nonAdminTestToken}`);

    expect(status).toEqual(200);
    expect(JSON.parse(text)).toEqual({ giftIdeas: ['foo', 'bar', 'baz'] });
  });

  it('adds giftIdeas successfully', async () => {
    const giftIdeasToAdd = { giftIdeas: ['foo', 'bar', 'baz'] };

    const { status } = await request
      .put('/api/giftIdeas/testUser1/localTestGroup')
      .set('Authorization', `Bearer ${nonAdminTestToken}`)
      .send(giftIdeasToAdd);

    const { giftIdeas } = await getMember(
      'testUser1',
      'localTestGroup',
      'giftIdeas'
    );

    expect(status).toEqual(200);
    expect(giftIdeas).toEqual(['foo', 'bar', 'baz']);
  });

  it('wishlist updated successfully', async () => {
    const giftIdeasLastUpdated = new Date().toISOString();

    const { status } = await request
      .put('/api/giftIdeas/testUser1/localTestGroup/updated')
      .set('Authorization', `Bearer ${nonAdminTestToken}`)
      .send({ giftIdeasLastUpdated });

    const giftIdeasUpdateDate = await getMember(
      'testUser1',
      'localTestGroup',
      'giftIdeasLastUpdated'
    );

    expect(status).toEqual(200);
    expect(giftIdeasUpdateDate).toEqual({ giftIdeasLastUpdated });
  });

  it('adds exclusions successfully', async () => {
    const exclusionsToAdd = { exclusions: ['santa', 'prancer'] };

    const { status } = await request
      .put('/api/exclusions/testUser1/localTestGroup')
      .set('Authorization', `Bearer ${nonAdminTestToken}`)
      .send(exclusionsToAdd);

    const { exclusions } = await getMember(
      'testUser1',
      'localTestGroup',
      'exclusions'
    );

    expect(status).toEqual(200);
    expect(exclusions).toEqual(['santa', 'prancer']);
  });
});
