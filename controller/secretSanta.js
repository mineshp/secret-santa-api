const AWS = require('aws-sdk');
const getCode = require('../utilities/getCode');
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
  getAllSecretSantaGroups,
  removeSecretSantaGroup
} = require('../db/secretSanta');

const TableName = process.env.SECRET_SANTA_TABLE;

const setupgroupID = async (ctx) => {
  const { groupID } = ctx.params;
  const data = ctx.request.body;
  const memberNamesInDraw = data.reduce((acc, person) => [...acc, person.memberName], []);

  if (!isValidgroupID(memberNamesInDraw)) {
    ctx.status = 404;
    ctx.body = JSON.stringify({
      error: 'Unable to create a group with less than two members.'
    });
    return;
  }

  const code = getCode[Math.floor(Math.random() * getCode.length)];
  getCode.splice(code, 1);

  const secretSantagroupID = data.map((person) => ({
    ...person,
    groupID,
    secretPassphrase: code,
    createdAt: new Date().toISOString(),
    giftIdeas: [],
    exclusions: []
  }));

  const payload = {
    TableName,
    secretSantagroupID
  };

  ctx.body = await setupSecretSantagroupID(payload);
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

const getAllGroups = async (ctx) => {
  const allGroups = await getAllSecretSantaGroups({ TableName });

  const countMembers = ({ groupID }, data) => data.filter((d) => d.groupID === groupID).length;

  const parsedGroups = allGroups.reduce((acc, val, i, arr) => [...acc,
    {
      groupName: val.groupID,
      count: countMembers(val, arr)
    }], []
  ).filter((group, index, arr) => arr.findIndex((t) => (t.groupName === group.groupName)) === index);

  ctx.body = parsedGroups;
};

const removeGroup = async (ctx) => {
  const { groupID } = ctx.params;

  const secretSantaGroupMembersToDelete = await getMembersFromgroupID({ TableName, groupID });
  ctx.body = await removeSecretSantaGroup({ TableName, groupID, secretSantaGroupMembersToDelete });
};

const sendEmailToMembers = async (ctx) => {
  const { groupID } = ctx.params;

  const secretSantaGroupMembers = await getMembersFromgroupID({ TableName, groupID });

  const members = secretSantaGroupMembers.map(({ memberName, secretPassphrase, email }) => ({
    memberName,
    secretPassphrase,
    email
  }));

  const emailParams = {
    mailConfig: {
      from: process.env.SENDER_EMAIL,
      replyTo: process.env.SENDER_EMAIL,
      subject: `Secret Santa 2019 ${groupID} - The wait is over!`
    },
    groupName: groupID,
    members
  };

  const lambda = new AWS.Lambda({
    region: 'eu-west-1'
  });

  const response = await lambda.invoke({
    FunctionName: process.env.SEND_EMAIL_FUNCTION,
    Payload: JSON.stringify(emailParams, null, 2) // pass params
  }).promise()
    .catch((err) => console.error(err));

  ctx.body = response.Payload;
};


module.exports = {
  setupgroupID,
  addGiftIdeas,
  addExclusions,
  drawNames,
  getSecretSanta,
  getGiftIdeas,
  getAllGroups,
  removeGroup,
  sendEmailToMembers
};
