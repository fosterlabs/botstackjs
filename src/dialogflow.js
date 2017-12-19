const _ = require('lodash');
const apiai = require('apiai');
const rp = require('request-promise');

const sessionStore = require('./session')();
const multiconf = require('./multiconf');
const unq = require('./common/unique_id');

let self = null;
let instance = null;

async function getDialogflowInstance() {
  const env = multiconf(self);
  const ACCESS_TOKEN = await env.getEnv('APIAI_ACCESS_TOKEN') || await env.getEnv('DIALOGFLOW_ACCESS_TOKEN');
  if (!instance) {
    if (!ACCESS_TOKEN) {
      throw new Error('APIAI_ACCESS_TOKEN or DIALOGFLOW_ACCESS_TOKEN environment variable cannot be empty');
    }
    instance = apiai(ACCESS_TOKEN);
  }
  return instance;
}

async function backchatDialogflowSync(response, senderId, pageId) {
  const env = multiconf(self);
  const BACKCHAT_APIAI_SYNC_URL = await env.getEnv('BACKCHAT_APIAI_SYNC_URL');

  if (BACKCHAT_APIAI_SYNC_URL) {
    const reqData = {
      url: BACKCHAT_APIAI_SYNC_URL,
      resolveWithFullResponse: true,
      method: 'POST',
      json: {
        sender_id: senderId,
        page_id: pageId,
        response
      }
    };

    try {
      const result = await rp(reqData);
      if (result.statusCode !== 200) {
        self.log.warn('Something wrong with BackChat endpoint', {
          module: 'botstack:dialogflow'
        });
      } else {
        self.log.debug('Copy Dialogflow response to BackChat endpoint', {
          module: 'botstack:dialogflow'
        });
      }
    } catch (e) {
      self.log.error(e, {
        module: 'botstack:dialogflow'
      });
      throw e;
    }
  }
}

function processResponse(response, senderId, pageId) {
  if (_.get(response, 'result')) {
    self.log.debug('Dialogflow result', {
      module: 'botstack:dialogflow',
      senderId,
      pageId,
      result: response.result
    });

    const responseData = _.get(response.result, 'fulfillment.data');
    const messages = _.get(response.result, 'fulfillment.messages');

    if (_.get(responseData, 'facebook')) {
      // FIXME: implement this type of messages
      self.log.debug('Response as formatted message', {
        module: 'botstack:dialogflow',
        senderId,
        pageId
      });
      return null;
    }
    const returnData = {
      messages,
      response
    };
    return returnData;
  }
  return null;
}

function getDialogflowResponse({ dialogflowRequest, senderId, eventName, message, sessionId, pageId } = {
  eventName: null, message: null
}) {
  return new Promise((resolve, reject) => {
    dialogflowRequest.on('response', (response) => {
      const logParams = {
        module: 'botstack:dialogflow',
        senderId,
        sessionId,
        pageId,
        response
      };

      if (eventName) {
        logParams.eventName = eventName;
      }

      if (message) {
        logParams.message = message;
      }

      self.log.debug('Dialogflow responded', logParams);

      backchatDialogflowSync(response, senderId, pageId);
      resolve(processResponse(response, senderId, pageId));
    });

    dialogflowRequest.on('error', (error) => {
      self.log.debug(error, {
        module: 'botstack:dialogflow',
        senderId,
        pageId
      });
      reject(error);
    });

    dialogflowRequest.end();
  });
}

async function processEvent(eventName, senderId, pageId) {
  const sessionResult = await sessionStore.get(unq.getUniqueId(senderId, pageId));
  const sessionId = sessionResult.sessionID;

  self.log.debug('Process event', {
    module: 'botstack:dialogflow',
    senderId,
    pageId,
    eventName,
    sessionId
  });

  const dialogflowService = await getDialogflowInstance();
  const dialogflowRequest = dialogflowService.eventRequest({
    name: eventName
  }, {
    sessionId
  });

  const result = await getDialogflowResponse({
    dialogflowRequest,
    senderId,
    eventName,
    sessionId });
  return result;
}

async function processTextMessage(message, senderId, pageId) {
  const sessionResult = await sessionStore.get(unq.getUniqueId(senderId, pageId));
  const sessionId = sessionResult.sessionID;

  self.log.debug('Process text message', {
    module: 'botstack:dialogflow',
    senderId,
    pageId,
    message,
    sessionId
  });

  const dialogflowService = await getDialogflowInstance();
  const dialogflowRequest = dialogflowService.textRequest(message, {
    sessionId
  });

  const result = await getDialogflowResponse({
    dialogflowRequest,
    senderId,
    message,
    sessionId });
  return result;
}

module.exports = (botstackInstance) => {
  self = botstackInstance;

  return {
    processTextMessage,
    processEvent,
    processResponse
  };
};
