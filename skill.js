const { getMembersFromgroupID } = require('./db/secretSanta');

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

const readList = (list) => [list.slice(0, -1).join(', '), list.slice(-1)[0]].join(list.length < 2 ? '' : ' and ');

const revealGifteesName = async (memberName, groupName, passphrase) => {
  const allMembers = await getMembersFromgroupID({ TableName, groupID: groupName });
  const memberFound = allMembers.find((member) => member.secretPassphrase === passphrase);

  if (!memberFound) {
    return { error: 'I am unable to find your details, please ensure you have an account setup for santa\'s secret,  to do this go to secretsanta.mineshdesigns.co.uk/enrol. If you have an account already, check you have provided the correct information from the santa\'s secret email.' };
  }
  if (memberFound.memberName !== memberName) {
    return { error: 'the name provided is incorrect, please check your email for details.' };
  }
  if (passphrase && memberFound && memberFound.secretPassphrase !== passphrase) {
    return { error: 'Passphrase is incorrect, please check email for details.' };
  }
  if (passphrase && memberFound) {
    return Buffer.from(memberFound.secretSanta, 'base64').toString('ascii');
  }
  return undefined;
};

const retrieveMemberByPassphrase = async (groupName, passphrase) => {
  const allMembers = await getMembersFromgroupID({ TableName, groupID: groupName });
  const memberFound = allMembers.find((member) => member.secretPassphrase === passphrase);

  if (!memberFound) {
    return { error: 'I am unable to find your details, please ensure you have an account setup for santa\'s secret,  to do this go to secretsanta.mineshdesigns.co.uk/enrol. If you have an account already, check you have provided the correct information from the santa\'s secret email.' };
  }
  if (passphrase && memberFound && memberFound.secretPassphrase !== passphrase) {
    return { error: 'Passphrase is incorrect, please check email for details.' };
  }
  if (passphrase && memberFound) {
    return memberFound;
  }
  return undefined;
};

const retrieveGifteesWishlist = async (groupName, memberName) => {
  const allMembers = await getMembersFromgroupID({ TableName, groupID: groupName });
  const memberFound = allMembers.find((member) => member.memberName === memberName);

  if (!memberFound) {
    return { error: 'I am unable to find your details, please ensure you have an account setup for santa\'s secret,  to do this go to secretsanta.mineshdesigns.co.uk/enrol. If you have an account already, check you have provided the correct information from the santa\'s secret email.' };
  }
  return memberFound.giftIdeas;
};

const secretSantaSkill = (event, context) => {
  switch (event.request.type) {
    case 'LaunchRequest':
      context.succeed(generateResponse(buildSpeechResponse('It\'s beginning to look a lot like Christmas', false)));
      break;
    case 'IntentRequest':
      switch (event.request.intent.name) {
        case 'AMAZON.StopIntent': {
          const stopMessage = 'Don\'t stop believing!';
          context.succeed(generateResponse(buildSpeechResponse(stopMessage, true)));
          break;
        }
        case 'AMAZON.HelpIntent': {
          const helpMessage = 'You can ask me the following, Ask secret santa to reveal santas secret? Ask secret santa what’s on my Wishlist? Ask secret santa what has my giftee wished for this christmas? Note! You must have a santas secret account to proceeed';
          context.succeed(generateResponse(buildSpeechResponse(helpMessage, true)));
          break;
        }
        case 'RevealSecretSanta': {
          const memberName = event.request.intent.slots.memberName.value.toLowerCase();
          const passphrase = event.request.intent.slots.passphrase.value;
          const groupName = event.request.intent.slots.groupName.value.toLowerCase();

          if (memberName && groupName && passphrase) {
            const aloneConfirmation = event.request.intent.slots.aloneConfirmation.value.toUpperCase();

            if (aloneConfirmation === 'YES') {
              revealGifteesName(memberName, groupName, passphrase)
                .then((response) => {
                  if (response.error) {
                    const errorMessage = `Ok ${memberName} ${response.error}`;
                    context.succeed(generateResponse(buildSpeechResponse(errorMessage, true)));
                  } else {
                    const finalMessage = `Ok ${memberName} your secret santa is ${response}, Happy shopping!`;
                    context.succeed(generateResponse(buildSpeechResponse(finalMessage, true)));
                  }
                });
            } else if (aloneConfirmation === 'NO') {
              const notAloneMessage = `Ok ${memberName} try again when you are alone!`;
              context.succeed(generateResponse(buildSpeechResponse(notAloneMessage, true)));
            }
          } else {
            const errorMessage = 'Looks like I didnt quite get all the information, please start again!';
            context.succeed(generateResponse(buildSpeechResponse(errorMessage, true)));
          }
          break;
        }
        case 'ManageMyWishlist': {
          const passphrase = event.request.intent.slots.passphrase.value.toLowerCase();
          const groupName = event.request.intent.slots.groupName.value.toLowerCase();

          if (groupName && passphrase) {
            retrieveMemberByPassphrase(groupName, passphrase)
              .then((response) => {
                if (response.error) {
                  const errorMessage = `I've gone to build a snowman, ${response.error}`;
                  context.succeed(generateResponse(buildSpeechResponse(errorMessage, true)));
                } else if (response.giftIdeas.length > 0) {
                  const gifts = readList(response.giftIdeas);
                  const finalMessage = `Ok ${response.memberName} you have added the following gift ideas, ${gifts}`;
                  context.succeed(generateResponse(buildSpeechResponse(finalMessage, true)));
                } else {
                  const finalMessage = 'Looks like your list is empty, ask me to add to your wishlist!';
                  context.succeed(generateResponse(buildSpeechResponse(finalMessage, true)));
                }
              });
          } else {
            const errorMessage = 'Looks like I didnt quite get all the information, please start again!';
            context.succeed(generateResponse(buildSpeechResponse(errorMessage, true)));
          }
          break;
        }
        case 'RevealGifteesWishlist': {
          const passphrase = event.request.intent.slots.passphrase.value.toLowerCase();
          const groupName = event.request.intent.slots.groupName.value.toLowerCase();

          if (groupName && passphrase) {
            retrieveMemberByPassphrase(groupName, passphrase)
              .then((response) => {
                if (response.error) {
                  const errorMessage = `I've gone to feed the reindeers, ${response.error}`;
                  context.succeed(generateResponse(buildSpeechResponse(errorMessage, true)));
                } else if (response.secretSanta) {
                  const secretName = Buffer.from(response.secretSanta, 'base64').toString('ascii');
                  retrieveGifteesWishlist(groupName, secretName)
                    .then((giftIdeas) => {
                      if (giftIdeas.error) {
                        const errorMessage = `I've gone to feed the reindeers, ${giftIdeas.error}`;
                        context.succeed(generateResponse(buildSpeechResponse(errorMessage, true)));
                      } else if (giftIdeas.length > 0) {
                        const gifts = readList(giftIdeas);
                        const myGifteesWishlistMessage = `Hi ${response.memberName} your giftee has wished for ${gifts}, Happy Shopping!`;
                        context.succeed(generateResponse(buildSpeechResponse(myGifteesWishlistMessage, true)));
                      } else {
                        const myGifteesEmptyWishlistMessage = `Hi ${response.memberName} your giftee has no wishes, please try again later.`;
                        context.succeed(generateResponse(buildSpeechResponse(myGifteesEmptyWishlistMessage, true)));
                      }
                    });
                } else {
                  const finalMessage = 'Oh oh! I didn\'t find what you are looking for';
                  context.succeed(generateResponse(buildSpeechResponse(finalMessage, true)));
                }
              });
          } else {
            const errorMessage = 'Looks like I didnt quite get all the information, sorry my hearings not great, please start again!';
            context.succeed(generateResponse(buildSpeechResponse(errorMessage, true)));
          }
          break;
        }
        default:
          context.succeed(generateResponse(buildSpeechResponse('Looks like something got lost in translation!', true)));
          break;
      }
      break;
    default:
      context.succeed(generateResponse(buildSpeechResponse('Looks like something got lost in translation!', true)));
      break;
  }
};


module.exports.handler = secretSantaSkill;
