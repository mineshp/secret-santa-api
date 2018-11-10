const gpc = require('generate-pincode');
const { isValidgroupID } = require('../validator');
const { getListOfNames, generateDraw } = require('../utilities/draw');
const {
  setupSecretSantagroupID,
  getGiftIdeasForMember,
  addGiftIdeasForMember,
  addExclusionForMember,
  getMembersFromgroupID,
  setSecretSantaForMember,
  getMySecretSanta,
} = require('../db/secretSanta');

const TableName = process.env.SECRET_SANTA_TABLE;

const setupgroupID = async (ctx) => {
  const { groupID } = ctx.params;
  const data = ctx.request.body;

  const memberNamesInDraw = data.reduce((acc, person) => [...acc, person.memberName], []);

  if (!isValidgroupID(memberNamesInDraw)) ctx.response.status = 404;

  const secretSantagroupID = data.map((person) => ({
    ...person,
    groupID,
    secretPassphrase: gpc(4),
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

const getGiftIdeas = async (ctx) => {
  const { memberName, groupID } = ctx.params;

  const payload = {
    TableName,
    memberName,
    groupID
  };

  ctx.body = await getGiftIdeasForMember(payload);
};


const addGiftIdeas = async (ctx) => {
  const { memberName, groupID } = ctx.params;
  const { giftIdeas } = ctx.request.body;

  if (giftIdeas.length < 1) ctx.response.status = 404;

  const payload = {
    TableName,
    memberName,
    groupID,
    giftIdeas
  };

  ctx.body = await addGiftIdeasForMember(payload);
};

const addExclusions = async (ctx) => {
  const { memberName, groupID } = ctx.params;
  const { exclusions } = ctx.request.body;

  if (exclusions.length < 1) ctx.response.status = 404;

  const payload = {
    TableName,
    memberName,
    groupID,
    exclusions
  };

  ctx.body = await addExclusionForMember(payload);
};

const drawNames = async (ctx) => {
  const { groupID } = ctx.params;
  const secretSantaGroupMembersInfo = await getMembersFromgroupID({ TableName, groupID });

  const namesInHat = getListOfNames(secretSantaGroupMembersInfo);
  const results = generateDraw(namesInHat, Object.assign([], namesInHat), secretSantaGroupMembersInfo);

  ctx.body = await setSecretSantaForMember({ TableName, results, groupID });
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
  getSecretSanta,
  getGiftIdeas
};
