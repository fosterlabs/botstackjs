const _ = require('lodash');

function _addSenderId(senderId) {
  const msg = {};
  _.set(msg, 'sender.id', _.toString(senderId));
  _.set(msg, 'timestamp', 0);
  return msg;
}

// https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_postbacks
function buildPostbackMessage({sender_id='1', title='', payload=''}={}) {
  const msg = {};
  _.merge(msg, _addSenderId(sender_id));
  _.set(msg, 'postback.title', title);
  _.set(msg, 'postback.payload', payload);
  _.set(msg, 'postback.referral', {});
  return msg;
}

// https://developers.facebook.com/docs/messenger-platform/reference/send-api/quick-replies/
function buildQuickReplieMessage({sender_id='1', text='', title='', payload=''}={}) {
  const msg = {};
  _.merge(msg, _addSenderId(sender_id));
  _.set(msg, 'message.mid', 'mid.0:0');
  _.set(msg, 'message.text', text);
  _.set(msg, 'quick_replies[0].content_type', 'text');
  _.set(msg, 'quick_replies[0].title', title);
  _.set(msg, 'quick_replies[0].payload', payload);
  return msg;
}

function buildPostbackGeolocationMessage({sender_id='1', text=''}={}) {
  const msg = {};
  _.merge(msg, _addSenderId(sender_id));
  _.set(msg, 'message.mid', 'mid.0:0');
  _.set(msg, 'message.text', text);
  _.set(msg, 'message.attachments[0].type', 'location');
  _.set(msg, 'message.attachments[0].coordinates.lat', 0);
  _.set(msg, 'message.attachments[0].coordinates.long', 0);
  return msg;
}

function buildTextMessage({sender_id='1', text=''}={}) {
  const msg = {};
  _.merge(msg, _addSenderId(sender_id));
  _.set(msg, 'message.mid', 'mid.0:0');
  _.set(msg, 'message.text', text);
  return msg;
}

function buildOptinsMessage({sender_id='1', ref='', user_ref=''}={}) {
  const msg = {};
  _.set(msg, 'sender.id', sender_id);
  _.set(msg, 'optin.ref', ref);
  _.set(msg, 'optin.user_ref', user_ref);
  return msg;
}

module.exports = {
  buildTextMessage,
  buildPostbackMessage,
  buildQuickReplieMessage,
  buildPostbackGeolocationMessage,
  buildOptinsMessage
};
