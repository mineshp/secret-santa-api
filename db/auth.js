const dbClient = require('./dbClient');

const isPassphraseValid = (passphraseInDB, userEnteredPassphrase) => passphraseInDB === userEnteredPassphrase;

const validateUser = async ({
  TableName, memberName, groupID, passphrase
}) => {
  const params = {
    TableName,
    Key: {
      memberName,
      groupID
    }
  };
  try {
    const user = await dbClient.get(params);
    if (user && user.memberName) {
      return isPassphraseValid(user.secretPassphrase, passphrase)
        ? user
        : { error: 'Invalid passphrase provided' };
    }
    return { error: `User ${memberName} for group ${groupID} not found.` };
  } catch (error) {
    return { error: `AWS - ${error.message}` };
  }
};

const setLoggedInTimestamp = async ({
  TableName, memberName, groupID,
}) => {
  const params = {
    TableName,
    Key: {
      memberName,
      groupID
    },
    UpdateExpression: 'set lastLoggedIn = :loggedIn',
    ExpressionAttributeValues: {
      ':loggedIn': new Date().toISOString()
    }
  };

  return dbClient.update(params)
    .catch((e) => JSON.stringify({ error: e }));
};

module.exports = {
  validateUser, setLoggedInTimestamp
};
