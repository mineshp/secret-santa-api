const { dbClient } = require('./dbClient');

const setupSecretSantagroupID = ({ TableName, secretSantagroupID }) => Promise.all(
  secretSantagroupID.map((member) => dbClient.put({
    TableName,
    Item: { ...member }
  }).promise()
  ));

const getGiftIdeasForMember = async ({
  TableName, memberName, groupID
}) => {
  const params = {
    TableName,
    Key: {
      memberName,
      groupID
    },
    ProjectionExpression: 'giftIdeas'
  };

  try {
    return (await dbClient.get(params).promise()).Item;
  } catch (error) {
    return { error: `AWS - ${error.message}` };
  }
};

const addGiftIdeasForMember = ({
  TableName, memberName, groupID, giftIdeas
}) => {
  const params = {
    TableName,
    Key: {
      memberName,
      groupID
    },
    UpdateExpression: 'set giftIdeas = :gi',
    ExpressionAttributeValues: {
      ':gi': giftIdeas,
    }
  };

  return dbClient.update(params).promise()
    .catch((e) => JSON.stringify({ error: e }));
};

const addExclusionForMember = ({
  TableName, memberName, groupID, exclusions
}) => {
  const params = {
    TableName,
    Key: {
      memberName,
      groupID
    },
    UpdateExpression: 'set exclusions = :ex',
    ExpressionAttributeValues: {
      ':ex': exclusions,
    }
  };

  return dbClient.update(params).promise()
    .catch((e) => JSON.stringify({ error: e }));
};

const getMembersFromgroupID = async ({ TableName, groupID }) => {
  const params = {
    TableName,
    IndexName: 'groupID-index',
    KeyConditionExpression: 'groupID = :groupID',
    ExpressionAttributeValues: {
      ':groupID': groupID
    }
  };

  try {
    return (await dbClient.query(params).promise()).Items;
  } catch (error) {
    return { error: `AWS - ${error.message}` };
  }
};

const setSecretSantaForMember = ({ TableName, results, groupID }) => Promise.all(
  results.map(({ memberName, secretSanta }) => {
    const encodedSecretSanta = Buffer.from(secretSanta).toString('base64');
    const params = {
      TableName,
      Key: {
        memberName,
        groupID
      },
      UpdateExpression: 'set secretSanta = :santa',
      ExpressionAttributeValues: {
        ':santa': encodedSecretSanta,
      }
    };

    return dbClient.update(params).promise()
      .then((data) => JSON.stringify(data))
      .catch((error) => JSON.stringify({ error }));
  })
);


const getMySecretSanta = async ({ TableName, memberName, groupID }) => {
  const params = {
    TableName,
    Key: {
      memberName,
      groupID
    },
    ProjectionExpression: 'secretSanta'
  };

  try {
    return (await dbClient.get(params).promise()).Item;
  } catch (error) {
    return { error: `AWS - ${error.message}` };
  }
};

const getMember = async ({ TableName, memberName, groupID }) => {
  const params = {
    TableName,
    Key: {
      memberName,
      groupID
    },
    ProjectionExpression: 'memberName,secretPassphrase,email'
  };

  try {
    return (await dbClient.get(params).promise()).Item;
  } catch (error) {
    return { error: `AWS - ${error.message}` };
  }
};

const getAllSecretSantaGroups = async ({ TableName }) => {
  const params = {
    TableName,
    ProjectionExpression: 'memberName,groupID'
  };
  try {
    return (await dbClient.scan(params).promise()).Items;
  } catch (error) {
    return { error: `AWS - ${error.message}` };
  }
};

const removeSecretSantaGroup = async ({ TableName, groupID, secretSantaGroupMembersToDelete }) => {
  const params = {
    RequestItems: {}
  };

  const Keys = secretSantaGroupMembersToDelete.map(({ memberName }) => ({
    DeleteRequest: {
      Key: {
        memberName,
        groupID
      }
    }
  }));

  params.RequestItems[TableName] = Keys;

  try {
    return (await dbClient.batchWrite(params).promise());
  } catch (error) {
    return { error: `AWS - ${error.message}` };
  }
};

module.exports = {
  setupSecretSantagroupID,
  getGiftIdeasForMember,
  addGiftIdeasForMember,
  addExclusionForMember,
  getMembersFromgroupID,
  setSecretSantaForMember,
  getMySecretSanta,
  getAllSecretSantaGroups,
  removeSecretSantaGroup,
  getMember
};
