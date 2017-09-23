const async = require('async');
const bedrock = require('bedrock');
const database = require('bedrock-mongodb');
const uuid = require('uuid/v4');
const AWS = require('aws-sdk');

require('./config');

const lambda = new AWS.Lambda();

bedrock.events.on('bedrock-mongodb.ready', callback => async.auto({
  openCollections: callback => database.openCollections(['lambda'], callback)
}, err => callback(err)));

bedrock.events.on('bedrock.started', callback => {
  const p1 = uuid();
  const p2 = uuid();
  const query = {p1};
  async.auto({
    insert: callback => database.collections.lambda.insert({p1, p2}, callback),
    find: ['insert', (results, callback) => database.collections.lambda
      .find(query).toArray((err, result) => {
        console.log('LOCAL-FIND', JSON.stringify(result, null ,2));
        callback();
      })],
    lambda: ['insert', (results, callback) => {
      const params = {
        FunctionName: 'mongoLambda',
        Payload: JSON.stringify(query)
      };
      lambda.invoke(params, (err, result) => {
        if(err) {
          console.error('ERROR', err);
        }
        console.log('LAMBDA-FIND', JSON.stringify(result, null, 2));
        callback(err);
      });
    }]
  }, callback);
});

bedrock.start();
