const { alexaGetMySecretSanta, getMembersFromgroupID } = require('./db/secretSanta');

const TableName = process.env.SECRET_SANTA_TABLE;

const buildSpeechResponse = (outputText, shouldEndSession) => ({
  outputSpeech: {
    type: 'PlainText',
    text: outputText
  },
  shouldEndSession
});

const generateResponse = (speechletResponse) => ({
  version: '1.0',
  response: speechletResponse
});

const validateUsers = async (memberName, groupName, passphrase) => {
  const response = await alexaGetMySecretSanta({
    TableName,
    memberName,
    groupID: groupName
  })
    .catch(() => ({ error: 'Name or group is incorrect, please verify details and try again!' }));
  console.log('in validateUsers called alexaGetMySecretSanta');
  console.log(memberName);
  console.log(groupName);
  console.log(response);
  if (!response) {
    return { error: 'we are unable to find your details, please check you have provided the correct information from the secret santa email.' };
  }
  if (passphrase && response && response.secretPassphrase === passphrase) {
    return Buffer.from(response.secretSanta, 'base64').toString('ascii');
  }
  if (passphrase && response && response.secretPassphrase !== passphrase) {
    return { error: 'Passphrase is incorrect, please check email with details.' };
  }
};

const findUser = async (groupName, passphrase) => {
  const allMembers = await getMembersFromgroupID({ TableName, groupID: groupName });
  console.log(allMembers);
  const memberFound = allMembers.find((member) => member.secretPassphrase === passphrase);
  console.log(memberFound);
  if (!memberFound) {
    return { error: 'we are unable to find your details, please check you have provided the correct information from the secret santa email.' };
  }
  if (passphrase && memberFound) {
    return Buffer.from(memberFound.secretSanta, 'base64').toString('ascii');
  }
  if (passphrase && memberFound && memberFound.secretPassphrase !== passphrase) {
    return { error: 'Passphrase is incorrect, please check email with details.' };
  }
};

const secretSantaSkill = (event, context, callback) => {
  switch (event.request.type) {
    case 'LaunchRequest':
      context.succeed(generateResponse(buildSpeechResponse('It\'s beginning to look a lot like Christmas', false)));
      break;
    case 'IntentRequest':
      switch (event.request.intent.name) {
        case 'RevealSecretSanta': {
          const memberName = event.request.intent.slots.memberName.value.toLowerCase();
          const passphrase = event.request.intent.slots.passphrase.value;
          const groupName = event.request.intent.slots.groupName.value.toLowerCase();

          if (memberName && groupName && passphrase) {
            const aloneConfirmation = event.request.intent.slots.aloneConfirmation.value.toUpperCase();

            if (aloneConfirmation === 'YES') {
              findUser(groupName, passphrase)
                .then((response) => {
                  console.log(response);
                  if (response.error) {
                    const errorMessage = `Ok ${memberName}, ${response.error}`;
                    context.succeed(generateResponse(buildSpeechResponse(errorMessage, true)));
                  } else {
                    const finalMessage = `Ok ${memberName}, your secret santa is ${response}, Happy shopping!`;
                    context.succeed(generateResponse(buildSpeechResponse(finalMessage, true)));
                  }
                });
            } else if (aloneConfirmation === 'NO') {
              const notAloneMessage = `Ok ${memberName}, try again when you are alone!`;
              context.succeed(generateResponse(buildSpeechResponse(notAloneMessage, true)));
            }
          } else {
            const errorMessage = 'Looks like we didnt quite get all the information, please start again!';
            context.succeed(generateResponse(buildSpeechResponse(errorMessage, true)));
          }
          break;
        }
        default:
          break;
      }
      break;
    default:
      break;
  }
};


module.exports.handler = secretSantaSkill;
