const AWS = require('aws-sdk');
const supertest = require('supertest');
const jwt = require('jsonwebtoken');

/* These env variables could also be done in a setupBeforeEnv.js file
and added to jest config in package.json.
Jest-dynalite would then have to use advanced config
*/
process.env.JWT_SECRET = 'testSecret';
process.env.SECRET_SANTA_TABLE = 'secret-santa-api-local';
const app = require('../..');
const dbClient = require('../../db/dbClient');

const mockLambda = {
  invoke: jest.fn(() => ({
    promise: jest.fn(),
    catch: jest.fn()
  }))
};

AWS.Lambda = jest.fn().mockImplementation(() => mockLambda);


const testToken = jwt.sign(
  {
    memberName: 'rudolph',
    groupID: 'testgroup',
    email: 'test@test.com',
    admin: false
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
      passphrase: 'test1'
    },
    {
      memberName: 'testUser2',
      groupID: groupNameToSetup,
      passphrase: 'test2'
    }
  ];

  return request
    .post(`/api/secretsanta/setup/${groupNameToSetup}`)
    .set('Authorization', `Bearer ${testToken}`)
    .send(newGroupPayload);
};

const getMember = async (memberName, groupID, fieldToReturn) => dbClient.get({
  TableName: process.env.SECRET_SANTA_TABLE,
  Key: {
    memberName,
    groupID
  },
  ProjectionExpression: fieldToReturn
});

describe('secretSanta', () => {
  let server = {};
  let request = {};

  beforeAll((done) => { server = app.listen(done); });
  beforeEach(async () => {
    request = supertest(server);
    await setupGroupForTesting(request);
  });
  afterAll(() => { server.close(); });

  it('setup group success', async () => {
    const getAllMembersForGroup = await dbClient.query({
      TableName: process.env.SECRET_SANTA_TABLE,
      IndexName: 'groupID-index',
      KeyConditionExpression: 'groupID = :groupID',
      ExpressionAttributeValues: {
        ':groupID': 'localTestGroup'
      }
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
        createdAt: getAllMembersForGroup[0].createdAt // TODO: expect.any(Date)
      },
      {
        groupID: 'localTestGroup',
        memberName: 'testUser2',
        admin: false,
        exclusions: [],
        giftIdeas: [],
        passphrase: 'test2',
        secretPassphrase: getAllMembersForGroup[1].secretPassphrase, // TODO:  expect.any
        createdAt: getAllMembersForGroup[1].createdAt // TODO: expect.any(Date)
      }
    ]);
  });

  it('setup group failed for less than two members', async () => {
    const groupNameToSetup = 'localTestGroup';
    const newGroupPayload = [
      {
        memberName: 'testUser1',
        groupID: groupNameToSetup,
        passphrase: 'test1'
      }
    ];

    const { status, text } = await request
      .post(`/api/secretsanta/setup/${groupNameToSetup}`)
      .set('Authorization', `Bearer ${testToken}`)
      .send(newGroupPayload);

    expect(status).toEqual(400);
    expect(text).toEqual('Unable to create a group with less than two members.');
  });

  it('gets giftIdeas successfully', async () => {
    await dbClient.update({
      TableName: process.env.SECRET_SANTA_TABLE,
      Key: {
        memberName: 'testUser1',
        groupID: 'localTestGroup'
      },
      UpdateExpression: 'set giftIdeas = :gi',
      ExpressionAttributeValues: {
        ':gi': ['foo', 'bar', 'baz'],
      }
    });

    const { status, text } = await request
      .get('/api/secretsanta/giftIdeas/testUser1/localTestGroup')
      .set('Authorization', `Bearer ${testToken}`);

    expect(status).toEqual(200);
    expect(JSON.parse(text)).toEqual({ giftIdeas: ['foo', 'bar', 'baz'] });
  });

  it('adds giftIdeas successfully', async () => {
    const giftIdeasToAdd = { giftIdeas: ['foo', 'bar', 'baz'] };

    const { status } = await request
      .put('/api/secretsanta/giftIdeas/testUser1/localTestGroup')
      .set('Authorization', `Bearer ${testToken}`)
      .send(giftIdeasToAdd);

    const { giftIdeas } = await getMember('testUser1', 'localTestGroup', 'giftIdeas');

    expect(status).toEqual(200);
    expect(giftIdeas).toEqual(['foo', 'bar', 'baz']);
  });

  it('adds exclusions successfully', async () => {
    const exclusionsToAdd = { exclusions: ['santa', 'prancer'] };

    const { status } = await request
      .put('/api/secretsanta/exclusions/testUser1/localTestGroup')
      .set('Authorization', `Bearer ${testToken}`)
      .send(exclusionsToAdd);

    const { exclusions } = await getMember('testUser1', 'localTestGroup', 'exclusions');

    expect(status).toEqual(200);
    expect(exclusions).toEqual(['santa', 'prancer']);
  });

  it('draws names for a group', async () => {
    const { status } = await request
      .get('/api/secretsanta/draw/localTestGroup')
      .set('Authorization', `Bearer ${testToken}`);

    const testUser1DrawnWith = await getMember('testUser1', 'localTestGroup', 'secretSanta');
    const testUser2DrawnWith = await getMember('testUser2', 'localTestGroup', 'secretSanta');

    expect(status).toEqual(200);
    expect(decodedStr(testUser1DrawnWith.secretSanta)).toEqual('testUser2');
    expect(decodedStr(testUser2DrawnWith.secretSanta)).toEqual('testUser1');
  });

  it('get my giftee', async () => {
    await request
      .get('/api/secretsanta/draw/localTestGroup')
      .set('Authorization', `Bearer ${testToken}`);

    const { status, text } = await request
      .get('/api/secretsanta/reveal/testUser2/localTestGroup')
      .set('Authorization', `Bearer ${testToken}`);

    expect(status).toEqual(200);
    expect(JSON.parse(text)).toMatchObject({
      secretSanta: expect.any(String)
    });

    const { secretSanta } = JSON.parse(text);
    const myGiftee = decodedStr(secretSanta);
    expect(myGiftee).toEqual('testUser1');
  });

  it('gets all members from group successfully', async () => {
    const { status, text } = await request
      .get('/api/secretsanta/localTestGroup')
      .set('Authorization', `Bearer ${testToken}`);

    const groupMembers = JSON.parse(text);

    expect(status).toEqual(200);
    expect(groupMembers).toHaveLength(2);
    expect(groupMembers).toEqual([
      {
        memberName: 'testUser1',
        admin: false,
        drawn: false
      },
      {
        memberName: 'testUser2',
        admin: false,
        drawn: false
      }
    ]);
  });

  it('admin > get all groups', async () => {
    const { status, text } = await request
      .get('/api/secretsanta/admin/allgroups')
      .set('Authorization', `Bearer ${testToken}`);

    const allGroups = JSON.parse(text);

    expect(status).toEqual(200);
    expect(allGroups).toHaveLength(1);
    expect(allGroups).toEqual([{
      groupName: 'localTestGroup',
      count: 2 // number of members
    }]);
  });

  it('admin > remove a group', async () => {
    const { status, text } = await request
      .delete('/api/secretsanta/localTestGroup')
      .set('Authorization', `Bearer ${testToken}`);

    const getAllGroups = await dbClient.scan({
      TableName: process.env.SECRET_SANTA_TABLE,
      ProjectionExpression: 'memberName,groupID'
    });

    expect(status).toEqual(200);
    expect(JSON.parse(text)).toEqual({ UnprocessedItems: {} });
    expect(getAllGroups).toHaveLength(0);
  });

  it('admin > send email to members', async () => {
    process.env.SEND_EMAIL_FUNCTION = 'test-email';

    const testUser1 = await getMember('testUser1', 'localTestGroup', 'secretPassphrase');
    const testUser2 = await getMember('testUser2', 'localTestGroup', 'secretPassphrase');

    const Payload = ({
      mailConfig: {
        subject: 'Secret Santa 2019 group LocalTestGroup  - The wait is over!'
      },
      groupName: 'localTestGroup',
      members: [
        {
          memberName: 'testUser1',
          secretPassphrase: testUser1.secretPassphrase
        },
        {
          memberName: 'testUser2',
          secretPassphrase: testUser2.secretPassphrase
        }
      ]
    });

    mockLambda.invoke.mockReturnValue({
      promise: () => Promise.resolve({ Payload })
    });

    const { status, text } = await request
      .get('/api/secretsanta/admin/sendEmail/localTestGroup')
      .set('Authorization', `Bearer ${testToken}`);

    expect(mockLambda.invoke).toHaveBeenCalledWith({
      FunctionName: 'test-email',
      Payload: JSON.stringify(Payload, null, 2)
    });
    expect(status).toEqual(200);
    expect(JSON.parse(text)).toEqual(Payload);
  });

  it('admin > send email to a member', async () => {
    process.env.SEND_EMAIL_FUNCTION = 'test-email';

    const testUser1 = await getMember('testUser1', 'localTestGroup', 'secretPassphrase');

    const Payload = ({
      mailConfig: {
        subject: 'Secret Santa 2019 group LocalTestGroup  - The wait is over!'
      },
      groupName: 'localTestGroup',
      members: [
        {
          memberName: 'testUser1',
          secretPassphrase: testUser1.secretPassphrase
        }
      ]
    });

    mockLambda.invoke.mockReturnValue({
      promise: () => Promise.resolve({ Payload })
    });

    const { status, text } = await request
      .get('/api/secretsanta/admin/sendEmail/localTestGroup/testUser1')
      .set('Authorization', `Bearer ${testToken}`);

    expect(mockLambda.invoke).toHaveBeenCalledWith({
      FunctionName: 'test-email',
      Payload: JSON.stringify(Payload, null, 2)
    });
    expect(status).toEqual(200);
    expect(JSON.parse(text)).toEqual(Payload);
  });

  it('wishlist updated successfully', async () => {
    const giftIdeasLastUpdated = new Date().toISOString();

    const { status } = await request
      .put('/api/secretsanta/giftIdeas/testUser1/localTestGroup/updated')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ giftIdeasLastUpdated });

    const giftIdeasUpdateDate = await getMember('testUser1', 'localTestGroup', 'giftIdeasLastUpdated');

    expect(status).toEqual(200);
    expect(giftIdeasUpdateDate).toEqual({ giftIdeasLastUpdated });
  });
});
