const lodash = require('lodash');
const log = require('../log');
const {
  textMessage,
  structuredMessage,
  quickReply,
  imageReply,
  customMessageReply
} = require('./message_types');
const { reply } = require('./reply');

const useOnlyFacebookResponse = lodash.has(process.env, 'BOTSTACK_ONLY_FB_RESP');

async function processMessagesFromApiAi(apiaiResponse, senderID, dontSend = false) {
  const allMessages = [];

  if (!apiaiResponse) {
    log.debug('Response from API.AI is empty', {
      module: 'botstack:fb'
    });
    return allMessages;
  } else if (!('messages' in apiaiResponse)) {
    log.debug('Response from API.AI not contains messages', {
      module: 'botstack:fb',
      response: apiaiResponse
    });
    return allMessages;
  }

  for (const message of apiaiResponse.messages) {
    let replyMessage = null;
    log.debug('Process message from API.AI', {
      module: 'botstack:fb',
      message,
      messageType: message.type
    });
    if(useOnlyFacebookResponse) {
      if(!(lodash.get(message, 'platform') === 'facebook')) {
        continue;
      }
    }
    switch (message.type) {
      case 0:
        replyMessage = textMessage(message.speech);
        break;
      case 1:
        replyMessage = structuredMessage(message);
        break;
      case 2:
        replyMessage = quickReply(message);
        break;
      case 3:
        replyMessage = imageReply(message);
        break;
      case 4:
        replyMessage = customMessageReply(message);
        break;
      default:
        log.error('Unknown message type', { module: 'botstack:fb ' });
        break;
    }
    if (dontSend) {
      allMessages.push(replyMessage);
    } else {
      await reply(replyMessage, senderID);
    }
  }
  return allMessages;
}

module.exports = {
  processMessagesFromApiAi
};
