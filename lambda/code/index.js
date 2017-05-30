'use strict';

const eventParsers = require('./eventParsers');
const queries = require('./queries')({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE
});
const handleError = (error, message) => {
  console.log('Error', message);
  return error.message;
};
exports.handler = (event, context, callback) => {
  const done = (error, response) => callback(null, {
    statusCode: error ? 400 : 200,
    body: error ? handleError(error, JSON.stringify({event, context, response})) : JSON.stringify(response),
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
  });
  switch (event.httpMethod) {
    case 'GET': // TODO: specialize
    case 'POST':
    case 'PUT':
    case 'DELETE':
      const insert = callback => queries.insert(
        JSON.stringify(event),
        JSON.stringify(context),
        JSON.stringify(eventParsers.parseUserAgent(event)),
        (error, results, fields) => error ? done(error, {results, fields}) : callback()
      );
      const select = callback => queries.select(
        (error, results, fields) => error ? done(error, {results, fields}) : callback(error, results, fields)
      );
      if (eventParsers.isIncognito(event)) select(done);
      else insert(() => select(done));
      break;
    default:
      done(new Error(`Unsupported method "${event.httpMethod}"`));
  }
};
