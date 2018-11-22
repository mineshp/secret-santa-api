const { dbClient } = require('./dbClient');

const isCodeValid = (passphraseInDB, userEnteredPassphrase) => passphraseInDB === userEnteredPassphrase;

const validateUser = async ({
  TableName, memberName, groupID, passphrase
}) => {
  const params = {
    TableName,
    Key: {
      memberName: memberName.toLowerCase(),
      groupID: groupID.toLowerCase()
    }
  };

  try {
    const user = (await dbClient.get(params).promise()).Item;
    if (user && user.memberName) {
      return isCodeValid(user.secretPassphrase, passphrase)
        ? user
        : { error: 'Invalid code provided' };
    }
    return { error: `User ${memberName} for group ${groupID} not found.` };
  } catch (error) {
    return { error: `AWS - ${error.message}` };
  }
};

module.exports = {
  validateUser
};
