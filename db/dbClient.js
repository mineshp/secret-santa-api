const AWS = require('aws-sdk');

AWS.config.update({ region: 'eu-west-1' });
const dbClient = new AWS.DynamoDB.DocumentClient();

module.exports = { dbClient };
