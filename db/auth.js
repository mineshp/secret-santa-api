const { dbClient } = require('./dbClient');

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
    const user = (await dbClient.get(params).promise()).Item;
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

module.exports = {
  validateUser
};
