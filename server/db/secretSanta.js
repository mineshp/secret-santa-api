const { dbClient } = require('./dbClient');

const setupSecretSantagroupID = ({ TableName, secretSantagroupID }) => secretSantagroupID.map((member) => dbClient.put({
  TableName,
  Item: { ...member }
}).promise()
);

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
    .then((data) => JSON.stringify(data))
    .catch((e) => console.log(e) || JSON.stringify({ error: e }));
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
    .then((data) => JSON.stringify(data))
    .catch((e) => console.log(e) || JSON.stringify({ error: e }));
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

const setSecretSantaForMember = ({
  TableName, memberName, groupID, secretSanta
}) => {
  const params = {
    TableName,
    Key: {
      memberName,
      groupID
    },
    UpdateExpression: 'set secretSanta = :santa',
    ExpressionAttributeValues: {
      ':santa': secretSanta,
    }
  };

  return dbClient.update(params).promise()
    .then((data) => JSON.stringify(data))
    .catch((e) => console.log(e) || JSON.stringify({ error: e }));
};

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

module.exports = {
  setupSecretSantagroupID,
  addGiftIdeasForMember,
  addExclusionForMember,
  getMembersFromgroupID,
  setSecretSantaForMember,
  getMySecretSanta
};
