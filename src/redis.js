const Promise = require('bluebird');

const co = Promise.coroutine;

const redis = require('redis');
const multiconf = require('./multiconf');

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

let client = null;
module.exports = (botstackInstance) => {
  const self = botstackInstance;
  const env = multiconf(self);

  async function getRedisInstance() {
    if (!client) {
      const REDIS_URL = await env.getEnv('REDIS_URL') || 'redis://localhost';
      const REDIS_PASSWORD = await env.getEnv('REDIS_PASSWORD');
      const redisOpts = {};
      if (REDIS_PASSWORD) {
        redisOpts.password = REDIS_PASSWORD;
      }
      console.log(`REDIS_URL: ${REDIS_URL}`);
      client = redis.createClient(REDIS_URL, redisOpts);
    }
    return client;
  }

  return {
    getRedisInstance
  };
};
