const { isValidgroupID } = require('../validator');
const { getListOfNames, generateDraw } = require('../utilities/draw');
const {
  setupSecretSantagroupID,
  addGiftIdeasForMember,
  addExclusionForMember,
  getMembersFromgroupID,
  setSecretSantaForMember,
  getMySecretSanta,
} = require('../db/secretSanta');

const TableName = 'secretSanta';

const setupgroupID = async (ctx) => {
  const { groupID } = ctx.params;
  const data = ctx.request.body;

  const memberNamesInDraw = data.reduce((acc, person) => [...acc, person.memberName], []);

  if (!isValidgroupID(memberNamesInDraw)) ctx.response.status = 404;

  const secretSantagroupID = data.map((person) => ({
    ...person,
    groupID,
    secretPassphrase: 'aaa',
    createdAt: new Date().toISOString(),
    giftIdeas: [],
    exclusions: []
  }));

  const payload = {
    TableName,
    secretSantagroupID
  };

  const save = await setupSecretSantagroupID(payload);

  ctx.body = save ? JSON.stringify({ ok: 1 }) : JSON.stringify({ error: 'Failed to save item' });
};

const addGiftIdeas = (ctx) => {
  const { memberName, groupID } = ctx.params;
  const { giftIdeas } = ctx.request.body;
  if (giftIdeas.length < 1) ctx.response.status = 404;

  const payload = {
    TableName,
    memberName,
    groupID,
    giftIdeas
  };

  ctx.body = addGiftIdeasForMember(payload);
};

const addExclusions = (ctx) => {
  const { memberName, groupID } = ctx.params;
  const { exclusions } = ctx.request.body;

  if (exclusions.length < 1) ctx.response.status = 404;

  const payload = {
    TableName,
    memberName,
    groupID,
    exclusions
  };

  ctx.body = addExclusionForMember(payload);
};

const drawNames = async (ctx) => {
  const { groupID } = ctx.params;
  const secretSantaGroupMembersInfo = await getMembersFromgroupID({ TableName: 'secretSanta', groupID });

  const namesInHat = getListOfNames(secretSantaGroupMembersInfo);
  const results = generateDraw(namesInHat, Object.assign([], namesInHat), secretSantaGroupMembersInfo);

  await results.forEach(({ memberName, secretSanta }) => {
    setSecretSantaForMember({
      TableName,
      memberName,
      groupID,
      secretSanta
    });
  });

  ctx.body = { ok: 1 };
};

const getSecretSanta = async (ctx) => {
  const { memberName, groupID } = ctx.params;

  ctx.body = await getMySecretSanta({ TableName, memberName, groupID });
};

module.exports = {
  setupgroupID,
  addGiftIdeas,
  addExclusions,
  drawNames,
  getSecretSanta
};
