const Promise = require('bluebird');

const co = Promise.coroutine;

const redis = require('redis');

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost';
const redisOpts = {};
if ('REDIS_PASSWORD' in process.env) {
  redisOpts.password = process.env.REDIS_PASSWORD;
}

console.log(`REDIS_URL: ${REDIS_URL}`);
const client = redis.createClient(REDIS_URL, redisOpts);

module.exports = client;
