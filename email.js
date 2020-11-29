const AWS = require('aws-sdk');
const buildHTMLEmail = require('./email/templates/secretSanta_alexa_version');

const SES = new AWS.SES({ region: 'eu-west-1' });

const sendEmail = async (
  groupName,
  { memberName, secretPassphrase, email: to },
  mailConfig
) => {
  const { from, reply_to: replyTo, subject } = mailConfig;
  const fromBase64 = Buffer.from(from).toString('base64');

  const htmlBody = buildHTMLEmail({
    memberName,
    groupName,
    secretPassphrase,
    drawYear: '2020',
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

  await SES.sendEmail(sesParams).promise();
  console.log(`sent email to ${memberName} - ${to}`);
};

/* eslint-disable-next-line */
const sendEmailToGroup = ({ groupName, members, mailConfig }) =>
  // eslint-disable-next-line implicit-arrow-linebreak
  members.map((member) => sendEmail(groupName, member, mailConfig));

module.exports.handler = sendEmailToGroup;
