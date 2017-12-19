const proxy = require('proxy-method-missing');
const dashbot = require('dashbot');
const multiconf = require('./multiconf');

module.exports = (botstackInstance) => {
  const self = botstackInstance;
  const env = multiconf(self);
  let dashbotInstance = null;

  async function getInstance(provider) {
    const apiKey = await env.getEnv('DASHBOT_API_KEY');
    dashbotInstance = dashbot(apiKey);
    if (dashbotInstance) {
      return dashbotInstance[provider];
    }
    return proxy({}, (method, ...args) => null);
  }

  return { getInstance };
};
