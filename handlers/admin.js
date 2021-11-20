const { getListOfNames, generateDraw } = require('../utilities/draw');
const { isValidgroupID } = require('../validator');
const drawGenerated = require('../email/drawGenerated');
const getCode = require('../utilities/getCode');
const { setupSecretSantagroupID } = require('../db/admin');
const {
  getMembersFromgroupID,
  setSecretSantaForMember,
  getAllSecretSantaGroups,
  removeSecretSantaGroup,
  getMember,
  getMySecretSanta,
  setSecretSantaRevealedFlag,
} = require('../db/admin');

const getAllGroups = async (ctx) => {
  const allGroups = await getAllSecretSantaGroups();

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
    secretSantagroupID,
  };

  ctx.body = await setupSecretSantagroupID(payload);
};

const drawNames = async (ctx) => {
  const { groupID } = ctx.params;
  const secretSantaGroupMembersInfo = await getMembersFromgroupID({
    groupID,
  });

  const namesInHat = getListOfNames(secretSantaGroupMembersInfo);
  const results = generateDraw(
    namesInHat,
    Object.assign([], namesInHat),
    secretSantaGroupMembersInfo
  );

  const drawHasBeenSavedToDB = await setSecretSantaForMember({
    results,
    groupID,
  });

  const secretSantaGroupMembers = await getMembersFromgroupID({
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

const removeGroup = async (ctx) => {
  const { groupID } = ctx.params;

  const secretSantaGroupMembersToDelete = await getMembersFromgroupID({
    groupID,
  });

  ctx.body = await removeSecretSantaGroup({
    groupID,
    secretSantaGroupMembersToDelete,
  });
};

const sendEmailToMembers = async (ctx) => {
  const { groupID } = ctx.params;

  const secretSantaGroupMembers = await getMembersFromgroupID({
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

  const members = new Array(await getMember({ memberName, groupID }));

  const response = await drawGenerated.sendEmail(groupID, members);

  ctx.body = response.Payload;
};

const getMembersFromGroup = async (ctx) => {
  const { groupID } = ctx.params;

  const members = await getMembersFromgroupID({ groupID });

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

const getSecretSanta = async (ctx) => {
  const { memberName, groupID } = ctx.params;

  ctx.body = await getMySecretSanta({ memberName, groupID });
};

const setSecretSantaRevealed = async (ctx) => {
  const { memberName, groupID } = ctx.params;

  ctx.body = await setSecretSantaRevealedFlag({ memberName, groupID });
};

module.exports = {
  drawNames,
  setupgroupID,
  getAllGroups,
  removeGroup,
  sendEmailToMembers,
  sendEmailToMember,
  getMembersFromGroup,
  getSecretSanta,
  setSecretSantaRevealed,
};
