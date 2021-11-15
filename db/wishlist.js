const dbClient = require('./dbClient');

const TableName = process.env.SECRET_SANTA_TABLE;

const addGiftIdeasForMember = ({ memberName, groupID, giftIdeas }) => {
  const params = {
    TableName,
    Key: {
      memberName,
      groupID,
    },
    UpdateExpression: 'set giftIdeas = :gi',
    ExpressionAttributeValues: {
      ':gi': giftIdeas,
    },
  };
  return dbClient.update(params).catch((e) => JSON.stringify({ error: e }));
};

const addExclusionForMember = ({ memberName, groupID, exclusions }) => {
  const params = {
    TableName,
    Key: {
      memberName,
      groupID,
    },
    UpdateExpression: 'set exclusions = :ex',
    ExpressionAttributeValues: {
      ':ex': exclusions,
    },
  };

  return dbClient.update(params).catch((e) => JSON.stringify({ error: e }));
};

const getGiftIdeasForMember = async ({ memberName, groupID }) => {
  const params = {
    TableName,
    Key: {
      memberName,
      groupID,
    },
    ProjectionExpression: 'giftIdeas',
  };

  try {
    return await dbClient.get(params);
  } catch (error) {
    return { error: `AWS - ${error.message}` };
  }
};

const updateGiftIdeasLastUpdated = async ({
  memberName,
  groupID,
  giftIdeasLastUpdated,
}) => {
  const params = {
    TableName,
    Key: {
      memberName,
      groupID,
    },
    UpdateExpression: 'set giftIdeasLastUpdated = :gilu',
    ExpressionAttributeValues: {
      ':gilu': giftIdeasLastUpdated,
    },
  };

  return dbClient.update(params).catch((e) => JSON.stringify({ error: e }));
};

module.exports = {
  addGiftIdeasForMember,
  addExclusionForMember,
  getGiftIdeasForMember,
  updateGiftIdeasLastUpdated,
};
