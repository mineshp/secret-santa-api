const { DynamoDB } = require('aws-sdk');

const dynamodbOptions = process.env.MOCK_DYNAMODB_ENDPOINT
  ? {
    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT,
    sslEnabled: false,
    region: 'local'
  }
  : {
    region: 'eu-west-1'
  };

const docClient = new DynamoDB.DocumentClient(dynamodbOptions);

const get = (params) => docClient
  .get(params)
  .promise()
  .then(({ Item }) => Item);

const query = (params) => docClient
  .query(params)
  .promise()
  .then(({ Items }) => Items);

const scan = (params) => docClient
  .scan(params)
  .promise()
  .then(({ Items }) => Items);

const put = (params) => docClient.put(params).promise();

const del = (params) => docClient.delete(params).promise();

const deleteMultiple = (params) => docClient.batchWrite(params).promise();

const update = (params) => docClient.update(params).promise();

module.exports = {
  delete: del,
  deleteMultiple,
  get,
  query,
  put,
  scan,
  update
};
