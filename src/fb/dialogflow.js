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

  function getLodashTemplateVariables(template) {
    const pattern = [
      '<%[=|-]?', // look for opening tag (<%, <%=, or <%-)
      '(?:[\\s]|if|\\()*', // accept any space after opening tag and before identifier
      '(.+?)', // capture the identifier name (`hello` in <%= hello %>)
      '(?:[\\s]|\\)|\\{)*', // accept any space after identifier and before closing tag
      '%>' // look for closing tag
    ].join('');

    const regex = new RegExp(pattern, 'g');
    const matches = [];
    let match = null;
    while (match=regex.exec(template)) {
      matches.push(match[1]);
    }
    return _.uniq(matches);
  }

  async function processTemplateString(templateString, senderId, pageId) {
    log.debug('on processTemplateString', { module: 'botstack:fb:dialogflow' });
    if (!'getBotstackTemplateStringVars' in self) {
      log.debug('getBotstackTemplateStringVars not found!', { module: 'botstack:fb:dialogflow' });
      return {
        ok: false,
        result: templateString
      };
    }
    const varNames = getLodashTemplateVariables(templateString);
    if (varNames.length == 0) {
      log.debug('no variables found in template!', { module: 'botstack:fb:dialogflow' });
      return {
        ok: true,
        result: templateString
      };
    }
    let varValues = {};
    try {
      varValues = await self.getBotstackTemplateStringVars(varNames, senderId, pageId);
    } catch (err) {
      log.error(err);
      return {
        ok: false,
        result: templateString
      };
    };
    let template = _.template(templateString);
    try {
      return {
        ok: true,
        result: template(varValues)
      };
    } catch (err) {
      log.error(err);
      return {
        ok: false,
        result: templateString
      };
    }
  }

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
      // parse templates
      if (_.isObject(replyMessage)) {
        const strReplyMessage = JSON.stringify(replyMessage);
        const res = await processTemplateString(strReplyMessage, senderId, pageId);
        replyMessage = JSON.parse(_.get(res, 'result'));
      } else {
        const res = await processTemplateString(replyMessage, senderId, pageId);
        replyMessage = _.get(res, 'result');
      }
      //
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
