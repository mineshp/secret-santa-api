const dbClient = require('./dbClient');

const TableName = process.env.SECRET_SANTA_TABLE;

const setSecretSantaForMember = ({ results, groupID }) =>
  Promise.all(
    results.map(({ memberName, secretSanta }) => {
      const encodedSecretSanta = Buffer.from(secretSanta).toString('base64');
      const params = {
        TableName,
        Key: {
          memberName,
          groupID,
        },
        UpdateExpression: 'set secretSanta = :santa',
        ExpressionAttributeValues: {
          ':santa': encodedSecretSanta,
        },
      };

      return dbClient
        .update(params)
        .then((data) => JSON.stringify(data))
        .catch((error) => JSON.stringify({ error }));
    })
  );

const setupSecretSantagroupID = ({ secretSantagroupID }) =>
  Promise.all(
    secretSantagroupID.map((member) =>
      dbClient.put({
        TableName,
        Item: { ...member },
      })
    )
  );

const getAllSecretSantaGroups = async () => {
  const params = {
    TableName,
    ProjectionExpression: 'memberName,groupID',
  };
  try {
    return await dbClient.scan(params);
  } catch (error) {
    return { error: `AWS - ${error.message}` };
  }
};

const getMembersFromgroupID = async ({ groupID }) => {
  const params = {
    TableName,
    IndexName: 'groupID-index',
    KeyConditionExpression: 'groupID = :groupID',
    ExpressionAttributeValues: {
      ':groupID': groupID,
    },
  };

  try {
    return await dbClient.query(params);
  } catch (error) {
    return { error: `AWS - ${error.message}` };
  }
};

const removeSecretSantaGroup = async ({
  groupID,
  secretSantaGroupMembersToDelete,
}) => {
  const params = {
    RequestItems: {},
  };

  const Keys = secretSantaGroupMembersToDelete.map(({ memberName }) => ({
    DeleteRequest: {
      Key: {
        memberName,
        groupID,
      },
    },
  }));

  params.RequestItems[TableName] = Keys;

  try {
    return await dbClient.deleteMultiple(params);
  } catch (error) {
    return { error: `AWS - ${error.message}` };
  }
};

const getMember = async ({ memberName, groupID }) => {
  const params = {
    TableName,
    Key: {
      memberName,
      groupID,
    },
    ProjectionExpression: 'memberName,secretPassphrase,email',
  };

  try {
    return await dbClient.get(params);
  } catch (error) {
    return { error: `AWS - ${error.message}` };
  }
};

const getMySecretSanta = async ({ memberName, groupID }) => {
  const params = {
    TableName,
    Key: {
      memberName,
      groupID,
    },
    ProjectionExpression: 'secretSanta',
  };

  try {
    return await dbClient.get(params);
  } catch (error) {
    return { error: `AWS - ${error.message}` };
  }
};

const setSecretSantaRevealedFlag = async ({ memberName, groupID }) => {
  const params = {
    TableName,
    Key: {
      memberName,
      groupID,
    },
    UpdateExpression: 'set revealedStatus = :ssr',
    ExpressionAttributeValues: {
      ':ssr': true,
    },
  };

  return dbClient.update(params).catch((e) => JSON.stringify({ error: e }));
};

module.exports = {
  getMember,
  setSecretSantaForMember,
  getMembersFromgroupID,
  setupSecretSantagroupID,
  getAllSecretSantaGroups,
  removeSecretSantaGroup,
  getMySecretSanta,
  setSecretSantaRevealedFlag,
};
