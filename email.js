const AWS = require('aws-sdk');
const buildHTMLEmail = require('./email/templates/secretSanta');

const SES = new AWS.SES({ region: 'eu-west-1' });

const sendEmail = async (groupName, { memberName, secretPassphrase, email: to }, mailConfig) => {
  const {
    from,
    reply_to: replyTo,
    subject,
  } = mailConfig;
  const fromBase64 = Buffer.from(from).toString('base64');

  const htmlBody = buildHTMLEmail({
    memberName,
    groupName,
    secretPassphrase,
    drawYear: '2019'
  });

  const sesParams = {
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: htmlBody,
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject,
      },
    },
    ReplyToAddresses: [replyTo],
    Source: `=?utf-8?B?${fromBase64}?= <mineshdesigns@gmail.com>`,
  };

  const response = await SES.sendEmail(sesParams).promise();
  console.log(`sent email to ${memberName} - ${to}`);
  console.log(response);
};

/* eslint-disable-next-line */
const sendEmailToGroup = (({ groupName, members, mailConfig }) => members.map((member) => sendEmail(groupName, member, mailConfig)));

module.exports.handler = sendEmailToGroup;
