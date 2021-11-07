const { Lambda } = require('aws-sdk');

const lambda = new Lambda({
  endpoint: 'https://lambda.eu-west-1.amazonaws.com',
  region: 'eu-west-1',
});

async function invoke(params) {
  return lambda
    .invoke(params)
    .promise()
    .catch((err) => {
      throw err;
    });
}

module.exports = { invoke };
