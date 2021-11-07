const lambda = require('../services/lambda');

const buildSubject = (groupName) =>
  `Secret Santa ${new Date().getFullYear()} group ${
    groupName.charAt(0).toUpperCase() + groupName.slice(1)
  }  - The wait is over!`;

const sendEmail = async (groupName, members) => {
  const emailParams = {
    mailConfig: {
      from: process.env.SENDER_EMAIL,
      replyTo: process.env.SENDER_EMAIL,
      subject: buildSubject(groupName),
    },
    groupName,
    members,
  };

  return lambda
    .invoke({
      FunctionName: process.env.SEND_EMAIL_FUNCTION,
      Payload: JSON.stringify(emailParams, null, 2),
    })
    .then();
};

module.exports = {
  sendEmail,
};
