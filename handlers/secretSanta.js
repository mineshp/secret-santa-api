const getCode = require('../utilities/getCode');
const { isValidgroupID } = require('../validator');
const { getListOfNames, generateDraw } = require('../utilities/draw');
const drawGenerated = require('../email/drawGenerated');
const {
  setupSecretSantagroupID,
  getGiftIdeasForMember,
  addGiftIdeasForMember,
  addExclusionForMember,
  getMembersFromgroupID,
  setSecretSantaForMember,
  getMySecretSanta,
  getAllSecretSantaGroups,
  removeSecretSantaGroup,
  getMember,
  updateGiftIdeasLastUpdated,
} = require('../db/secretSanta');

const TableName = process.env.SECRET_SANTA_TABLE;

const setupgroupID = async (ctx) => {
  const { groupID } = ctx.params;
  const data = ctx.request.body;
  const memberNamesInDraw = data.reduce(
    (acc, person) => [...acc, person.memberName],
    []
  );

  if (!isValidgroupID(memberNamesInDraw)) {
    ctx.throw(400, 'Unable to create a group with less than two members.');
  }

  const list = getCode;

  const secretSantagroupID = data.map((person) => {
    const randNum = Math.floor(Math.random() * list.length);
    const code = list[randNum];
    list.splice(randNum, 1);
    return {
      ...person,
      groupID,
      secretPassphrase: code,
      createdAt: new Date().toISOString(),
      giftIdeas: [],
      exclusions: [],
      admin: false,
    };
  });

  const payload = {
    TableName,
    secretSantagroupID,
  };

  ctx.body = await setupSecretSantagroupID(payload);
};

const getGiftIdeas = async (ctx) => {
  const { memberName, groupID } = ctx.params;

  const payload = {
    TableName,
    memberName,
    groupID,
  };

  const getGifts = await getGiftIdeasForMember(payload);
  ctx.body = getGifts;
};

const addGiftIdeas = async (ctx) => {
  const { memberName, groupID } = ctx.params;
  const { giftIdeas } = ctx.request.body;

  if (giftIdeas.length < 1) ctx.response.status = 404;

  const payload = {
    TableName,
    memberName,
    groupID,
    giftIdeas: giftIdeas.map((g) => decodeURI(g)),
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
    exclusions,
  };

  ctx.body = await addExclusionForMember(payload);
};

const drawNames = async (ctx) => {
  const { groupID } = ctx.params;
  const secretSantaGroupMembersInfo = await getMembersFromgroupID({
    TableName,
    groupID,
  });

  const namesInHat = getListOfNames(secretSantaGroupMembersInfo);
  const results = generateDraw(
    namesInHat,
    Object.assign([], namesInHat),
    secretSantaGroupMembersInfo
  );

  const drawHasBeenSavedToDB = await setSecretSantaForMember({
    TableName,
    results,
    groupID,
  });

  const secretSantaGroupMembers = await getMembersFromgroupID({
    TableName,
    groupID,
  });

  const members = secretSantaGroupMembers.map(
    ({ memberName, secretPassphrase, email }) => ({
      memberName,
      secretPassphrase,
      email,
    })
  );

  if (drawHasBeenSavedToDB) {
    await drawGenerated.sendEmail(groupID, members);
  }

  ctx.body = drawHasBeenSavedToDB;
};

const getSecretSanta = async (ctx) => {
  const { memberName, groupID } = ctx.params;

  ctx.body = await getMySecretSanta({ TableName, memberName, groupID });
};

const getAllGroups = async (ctx) => {
  const allGroups = await getAllSecretSantaGroups({ TableName });

  const countMembers = ({ groupID }, data) =>
    data.filter((d) => d.groupID === groupID).length;

  const parsedGroups = allGroups
    .reduce(
      (acc, val, i, arr) => [
        ...acc,
        {
          groupName: val.groupID,
          count: countMembers(val, arr),
        },
      ],
      []
    )
    .filter(
      (group, index, arr) =>
        arr.findIndex((t) => t.groupName === group.groupName) === index
    );

  ctx.body = parsedGroups;
};

const removeGroup = async (ctx) => {
  const { groupID } = ctx.params;

  const secretSantaGroupMembersToDelete = await getMembersFromgroupID({
    TableName,
    groupID,
  });

  ctx.body = await removeSecretSantaGroup({
    TableName,
    groupID,
    secretSantaGroupMembersToDelete,
  });
};

const sendEmailToMembers = async (ctx) => {
  const { groupID } = ctx.params;

  const secretSantaGroupMembers = await getMembersFromgroupID({
    TableName,
    groupID,
  });

  const members = secretSantaGroupMembers.map(
    ({ memberName, secretPassphrase, email }) => ({
      memberName,
      secretPassphrase,
      email,
    })
  );

  const response = await drawGenerated.sendEmail(groupID, members);
  ctx.body = response.Payload;
};

const sendEmailToMember = async (ctx) => {
  const { groupID, memberName } = ctx.params;

  const members = new Array(
    await getMember({ TableName, memberName, groupID })
  );

  const response = await drawGenerated.sendEmail(groupID, members);

  ctx.body = response.Payload;
};

const getMembersFromGroup = async (ctx) => {
  const { groupID } = ctx.params;

  const members = await getMembersFromgroupID({ TableName, groupID });

  ctx.body = members.map(
    ({
      memberName,
      email,
      secretSanta,
      admin,
      lastLoggedIn,
      giftIdeasLastUpdated,
    }) => ({
      memberName,
      email,
      drawn: !!secretSanta,
      admin,
      lastLoggedIn,
      giftIdeasLastUpdated,
    })
  );
};

const setGiftIdeasLastUpdated = async (ctx) => {
  const { memberName, groupID } = ctx.params;
  const { giftIdeasLastUpdated } = ctx.request.body;

  const payload = {
    TableName,
    memberName,
    groupID,
    giftIdeasLastUpdated,
  };
  ctx.body = await updateGiftIdeasLastUpdated(payload);
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
  sendEmailToMembers,
  sendEmailToMember,
  getMembersFromGroup,
  setGiftIdeasLastUpdated,
};
