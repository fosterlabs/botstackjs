const lodash = require('lodash');
const SmoochCore = require('smooch-core');

const log = require('./log');

let smoochInstance = null;
function getSmoochInstance() {
  if (!smoochInstance) {
    smoochInstance = new SmoochCore({
      keyId: process.env.SMOOCH_KEY_ID || '',
      secret: process.env.SMOOCH_SECRET || '',
      scope: process.env.SMOOCH_SCOPE || 'app'
    });
  }
  return smoochInstance;
}

async function sendCommonMessage(authorID, message = {}) {
  const smooch = getSmoochInstance();
  const commonMessage = {
    role: 'appMaker'
  };
  lodash.merge(commonMessage, message);
  const result = await smooch.appUsers.sendMessage(authorID, commonMessage);
  return result;
}

function textMessage(message) {
  return {
    type: 'text',
    text: message
  };
}

function imageReply(message) {
  return {
    type: 'image',
    text: '',
    mediaUrl: message.imageUrl || message.url
  };
}

async function processMessagesFromApiAi(apiAiResponse, senderID) {
  const results = [];
  const smooch = getSmoochInstance();
  for (const message of apiAiResponse.messages) {
    let replyMessage = null;
    log.debug('Process message from API.AI', {
      module: 'botstack:smooch',
      message,
      messageType: message.type
    });
    switch (message.type) {
      case 0: // text message
        replyMessage = textMessage(message.speech);
        break;
      case 3: // image response
        replyMessage = imageReply(message);
        break;
    }
    const result = await sendCommonMessage(senderID, replyMessage);
    results.push(result);
  }
  return results;
}

module.exports = {
  processMessagesFromApiAi
};
