const _ = require('lodash');
const SmoochCore = require('smooch-core');
const multiconf = require('./multiconf');

const log = require('./log');

let smoochInstance = null;

module.exports = (botstackInstance) => {
  const self = botstackInstance;
  const env = multiconf(self);

  async function getSmoochInstance() {
    if (!smoochInstance) {
      const keyId = await env.getEnv('SMOOCH_KEY_ID');
      const secret = await env.getEnv('SMOOCH_SECRET');
      const scope = await env.getEnv('SMOOCH_SCOPE') || 'app';
      if (!keyId || !secret) {
        throw new Error("Can't configure Smooch instance. Invalid value in the environment variables");
      }
      smoochInstance = new SmoochCore({ keyId, secret, scope });
    }
    return smoochInstance;
  }

  async function sendCommonMessage(authorId, message = {}) {
    const smooch = await getSmoochInstance();
    const commonMessage = { role: 'appMaker' };
    _.merge(commonMessage, message);
    const result = await smooch.appUsers.sendMessage(authorId, commonMessage);
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

  async function processMessagesFromDialogflow(dialogflowResponse, senderId) {
    const results = [];
    const smooch = await getSmoochInstance();
    for (const message of dialogflowResponse.messages) {
      let replyMessage = null;
      log.debug('Process message from Dialogflow', {
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
      // TODO: use this unq Id by senderId + pageId ???
      const result = await sendCommonMessage(senderId, replyMessage);
      results.push(result);
    }
    return results;
  }

  return { processMessagesFromDialogflow };
};
