const _ = require('lodash');
const rp = require('request-promise');
const log = require('../log');

async function reply(message, senderId, {messagingType='RESPONSE', params=null}={}) {
  const logData = {};
  const sendData = {
    messaging_type: messagingType,
    message
  };

  logData['module'] = 'botstack:fb';
  logData['message'] = message;

  if (_.get(params, 'use_user_ref') === true) {
    logData['recipientUserRef'] = senderId;
    sendData['recipient'] = {
      user_ref: senderId
    };
  } else {
    logData['senderId'] = senderId;
    sendData['recipient'] = {
      id: senderId
    };
  }

  if (message == null) {
    log.debug('This message ignored to send', logData);
    return null;
  } else {
    log.debug('Sending message', logData);
  }

  const reqData = {
    url: 'https://graph.facebook.com/v2.9/me/messages',
    qs: {
      access_token: process.env.FB_PAGE_ACCESS_TOKEN
    },
    method: 'POST',
    json: sendData,
    resolveWithFullResponse: true
  };
  const res = await rp(reqData);
  return res;
}

module.exports = {
  reply
};
