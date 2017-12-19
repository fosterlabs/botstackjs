const _ = require('lodash');
const rp = require('request-promise');
const log = require('../log');
const multiconf = require('../multiconf');
const constants = require('../common/constants');

let self = null;

async function reply(message, senderId, {
  messagingType = 'RESPONSE',
  params = null,
  pageId = null } = {}) {
  const env = multiconf(self);
  const logData = {};
  const sendData = {
    messaging_type: messagingType,
    message
  };

  logData.module = 'botstack:fb';
  logData.message = message;

  if (_.get(params, 'use_user_ref') === true) {
    logData.recipientUserRef = senderId;
    sendData.recipient = {
      user_ref: senderId
    };
  } else if (_.get(params, 'is_customer_matching') === true) {
    sendData.recipient = {
      phone_number: _.get(params, 'customer_matching.phone_number'),
      name: {
        first_name: _.get(params, 'customer_matching.first_name'),
        last_name: _.get(params, 'customer_matching.last_name')
      }
    };
  } else {
    logData.senderId = senderId;
    sendData.recipient = {
      id: senderId
    };
  }

  if (message == null) {
    log.debug('This message ignored to send', logData);
    return null;
  }
  log.debug('Sending message', logData);


  const FB_PAGE_ACCESS_TOKEN = await env.getFacebookPageTokenByPageID(pageId);
  const reqData = {
    url: constants.getFacebookGraphURL('/me/messages'),
    qs: {
      access_token: FB_PAGE_ACCESS_TOKEN
    },
    method: 'POST',
    json: sendData,
    resolveWithFullResponse: true
  };
  // console.log(reqData);
  const res = await rp(reqData);
  return res;
}

module.exports = (botstackInstance) => {
  self = botstackInstance;

  return {
    reply
  };
};
