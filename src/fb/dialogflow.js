const _ = require('lodash');
const log = require('../log');
const {
  textMessage,
  structuredMessage,
  quickReply,
  imageReply,
  customMessageReply
} = require('./message_types');
const replyInstance = require('./reply');
const multiconf = require('../multiconf');

module.exports = (botstackInstance) => {
  const self = botstackInstance;
  const env = multiconf(self);

  const { reply } = replyInstance(self);

  async function processMessagesFromDialogflow(dialogFlowResponse, senderId, pageId, dontSend = false) {
    const useOnlyFacebookResponse = await env.getEnv('BOTSTACK_ONLY_FB_RESP');
    const allMessages = [];

    if (!dialogFlowResponse) {
      log.debug('Response from Dialogflow is empty', {
        module: 'botstack:fb'
      });
      return allMessages;
    } else if (!('messages' in dialogFlowResponse)) {
      log.debug('Response from Dialogflow not contains messages', {
        module: 'botstack:fb',
        response: dialogFlowResponse
      });
      return allMessages;
    }

    for (const message of dialogFlowResponse.messages) {
      let replyMessage = null;
      log.debug('Process message from Dialogflow', {
        module: 'botstack:fb',
        message,
        messageType: message.type
      });
      if (useOnlyFacebookResponse) {
        if (!(_.get(message, 'platform') === 'facebook')) {
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
      } else if (pageId) {
        await reply(replyMessage, senderId, { pageId });
      } else {
        await reply(replyMessage, senderId);
      }
    }
    return allMessages;
  }

  const processMessagesFromApiAi = processMessagesFromDialogflow;

  return {
    processMessagesFromApiAi,
    processMessagesFromDialogflow
  };
};
