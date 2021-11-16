const supertest = require('supertest');
const jwt = require('jsonwebtoken');
const lambda = require('../../services/lambda');
const getQuotes = require('../../utilities/quotes');

jest.mock('../../services/lambda');
jest.mock('../../utilities/quotes');

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

const decodedStr = (giftee) => Buffer.from(giftee, 'base64').toString('ascii');

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

describe('secretSanta', () => {
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

  it('setup group success', async () => {
    const getAllMembersForGroup = await dbClient.query({
      TableName: process.env.SECRET_SANTA_TABLE,
      IndexName: 'groupID-index',
      KeyConditionExpression: 'groupID = :groupID',
      ExpressionAttributeValues: {
        ':groupID': 'localTestGroup',
      },
    });

    expect(getAllMembersForGroup).toMatchObject([
      {
        groupID: 'localTestGroup',
        memberName: 'testUser1',
        admin: false,
        exclusions: [],
        giftIdeas: [],
        passphrase: 'test1',
        secretPassphrase: getAllMembersForGroup[0].secretPassphrase, //  TODO: expect.any(String)
        createdAt: getAllMembersForGroup[0].createdAt, // TODO: expect.any(Date)
      },
      {
        groupID: 'localTestGroup',
        memberName: 'testUser2',
        admin: false,
        exclusions: [],
        giftIdeas: [],
        passphrase: 'test2',
        secretPassphrase: getAllMembersForGroup[1].secretPassphrase, // TODO:  expect.any
        createdAt: getAllMembersForGroup[1].createdAt, // TODO: expect.any(Date)
      },
    ]);
  });

  it('setup group failed for less than two members', async () => {
    const groupNameToSetup = 'localTestGroup';
    const newGroupPayload = [
      {
        memberName: 'testUser1',
        groupID: groupNameToSetup,
        passphrase: 'test1',
      },
    ];

    const { status, text } = await request
      .post(`/api/admin/setup/${groupNameToSetup}`)
      .set('Authorization', `Bearer ${adminTestToken}`)
      .send(newGroupPayload);

    expect(status).toEqual(400);
    expect(text).toEqual(
      'Unable to create a group with less than two members.'
    );
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

  it('get my giftee', async () => {
    await request
      .get('/api/admin/draw/localTestGroup')
      .set('Authorization', `Bearer ${adminTestToken}`);

    const { status, text } = await request
      .get('/api/reveal/testUser2/localTestGroup')
      .set('Authorization', `Bearer ${nonAdminTestToken}`);

    expect(status).toEqual(200);
    expect(JSON.parse(text)).toMatchObject({
      secretSanta: expect.any(String),
    });

    const { secretSanta } = JSON.parse(text);
    const myGiftee = decodedStr(secretSanta);
    expect(myGiftee).toEqual('testUser1');
  });

  it('gets quotes', async () => {
    getQuotes.mockReturnValue(['foo', 'bar', 'baz']);
    const { status, text } = await request.get('/api/displayQuotes');

    expect(status).toEqual(200);
    expect(JSON.parse(text)).toMatch(/^(foo|bar|baz)/);
  });

  it('draws names for a group', async () => {
    lambda.invoke.mockResolvedValue({});

    const { status } = await request
      .get('/api/admin/draw/localTestGroup')
      .set('Authorization', `Bearer ${adminTestToken}`);

    const testUser1DrawnWith = await getMember(
      'testUser1',
      'localTestGroup',
      'secretSanta'
    );
    const testUser2DrawnWith = await getMember(
      'testUser2',
      'localTestGroup',
      'secretSanta'
    );

    expect(status).toEqual(200);

    expect(decodedStr(testUser1DrawnWith.secretSanta)).toEqual('testUser2');
    expect(decodedStr(testUser2DrawnWith.secretSanta)).toEqual('testUser1');

    expect(lambda.invoke).toHaveBeenCalledWith({
      FunctionName: 'test-email',
      Payload: expect.stringContaining(
        `Secret Santa ${new Date().getFullYear()} group LocalTestGroup  - The wait is over!`
      ),
    });
  });

  it('admin > gets all members from group successfully', async () => {
    const taskActionDate = new Date().toISOString();
    await dbClient.update({
      TableName: process.env.SECRET_SANTA_TABLE,
      Key: {
        memberName: 'testUser1',
        groupID: 'localTestGroup',
      },
      UpdateExpression:
        'set giftIdeas = :gi, lastLoggedIn = :lli, giftIdeasLastUpdated = :gilu',
      ExpressionAttributeValues: {
        ':gi': ['foo', 'bar', 'baz'],
        ':lli': taskActionDate,
        ':gilu': taskActionDate,
      },
    });

    const { status, text } = await request
      .get('/api/admin/localTestGroup')
      .set('Authorization', `Bearer ${adminTestToken}`);

    const groupMembers = JSON.parse(text);

    expect(status).toEqual(200);
    expect(groupMembers).toHaveLength(2);
    expect(groupMembers).toEqual([
      {
        memberName: 'testUser1',
        admin: false,
        drawn: false,
        lastLoggedIn: taskActionDate,
        giftIdeasLastUpdated: taskActionDate,
      },
      {
        memberName: 'testUser2',
        admin: false,
        drawn: false,
      },
    ]);
  });

  it('admin > get all groups', async () => {
    const { status, text } = await request
      .get('/api/admin/allgroups')
      .set('Authorization', `Bearer ${adminTestToken}`);

    const allGroups = JSON.parse(text);

    expect(status).toEqual(200);
    expect(allGroups).toHaveLength(1);
    expect(allGroups).toEqual([
      {
        groupName: 'localTestGroup',
        count: 2, // number of members
      },
    ]);
  });

  it('admin > remove a group', async () => {
    const { status, text } = await request
      .delete('/api/admin/localTestGroup')
      .set('Authorization', `Bearer ${adminTestToken}`);

    const getAllGroups = await dbClient.scan({
      TableName: process.env.SECRET_SANTA_TABLE,
      ProjectionExpression: 'memberName,groupID',
    });

    expect(status).toEqual(200);
    expect(JSON.parse(text)).toEqual({ UnprocessedItems: {} });
    expect(getAllGroups).toHaveLength(0);
  });

  it('admin > send email to a member', async () => {
    const testUser1 = await getMember(
      'testUser1',
      'localTestGroup',
      'secretPassphrase'
    );

    const Payload = {
      mailConfig: {
        subject: `Secret Santa ${new Date().getFullYear()} group LocalTestGroup  - The wait is over!`,
      },
      groupName: 'localTestGroup',
      members: [
        {
          memberName: 'testUser1',
          secretPassphrase: testUser1.secretPassphrase,
        },
      ],
    };

    lambda.invoke.mockResolvedValue({ Payload });

    const { status, text } = await request
      .get('/api/admin/sendEmail/localTestGroup/testUser1')
      .set('Authorization', `Bearer ${adminTestToken}`);

    expect(await lambda.invoke).toHaveBeenCalledWith({
      FunctionName: 'test-email',
      Payload: JSON.stringify(Payload, null, 2),
    });
    expect(status).toEqual(200);
    expect(JSON.parse(text)).toEqual(Payload);
  });

  it('admin > send email to members', async () => {
    const testUser1 = await getMember(
      'testUser1',
      'localTestGroup',
      'secretPassphrase'
    );
    const testUser2 = await getMember(
      'testUser2',
      'localTestGroup',
      'secretPassphrase'
    );

    const Payload = {
      mailConfig: {
        subject: `Secret Santa ${new Date().getFullYear()} group LocalTestGroup  - The wait is over!`,
      },
      groupName: 'localTestGroup',
      members: [
        {
          memberName: 'testUser1',
          secretPassphrase: testUser1.secretPassphrase,
        },
        {
          memberName: 'testUser2',
          secretPassphrase: testUser2.secretPassphrase,
        },
      ],
    };

    lambda.invoke.mockResolvedValue({ Payload });

    const { status, text } = await request
      .get('/api/admin/sendEmail/localTestGroup')
      .set('Authorization', `Bearer ${adminTestToken}`);

    expect(await lambda.invoke).toHaveBeenCalledWith({
      FunctionName: 'test-email',
      Payload: JSON.stringify(Payload, null, 2),
    });
    expect(status).toEqual(200);
    expect(JSON.parse(text)).toEqual(Payload);
  });
});
