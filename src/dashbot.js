const lodash = require('lodash');
const proxy = require('proxy-method-missing');

let dashbot = null;
if ('DASHBOT_API_KEY' in process.env) {
  dashbot = require('dashbot')(process.env.DASHBOT_API_KEY);
}

module.exports = function (provider) {
  if (dashbot) {
    return dashbot[provider];
  }
  return proxy({}, (method, ...args) => null);
};
