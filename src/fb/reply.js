const rp = require('request-promise');
const log = require('./log');

async function reply(message, senderId) {
  if (message == null) {
    log.debug('This message ignored to send', {
      module: 'botstack:fb',
      senderId,
      message
    });
    return null;
  }
  log.debug('Sending message', {
    module: 'botstack:fb',
    senderId,
    message
  });
  const reqData = {
    url: 'https://graph.facebook.com/v2.9/me/messages',
    qs: {
      access_token: process.env.FB_PAGE_ACCESS_TOKEN
    },
    method: 'POST',
    json: {
      recipient: {
        id: senderId
      },
      message
    },
    resolveWithFullResponse: true
  };
  const res = await rp(reqData);
  return res;
}

module.exports = {
  reply
};
