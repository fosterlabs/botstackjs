const lodash = require('lodash');
const apiai = require('apiai');
const request = require('request');
const rp = require('request-promise');

const sessionStore = require('./session.js')();
const log = require('./log.js');

const APIAI_ACCESS_TOKEN = process.env.APIAI_ACCESS_TOKEN;
const APIAI_LANG = 'en';
const apiAiService = apiai(APIAI_ACCESS_TOKEN);

async function backchatApiAiSync(response) {
  if (process.env.BACKCHAT_APIAI_SYNC_URL) {
    const reqData = {
      url: process.env.BACKCHAT_APIAI_SYNC_URL,
      resolveWithFullResponse: true,
      method: 'POST',
      json: response
    };
    try {
      const result = await rp(reqData);
      if (result.statusCode != 200) {
        log.warn('Something wrong with BackChat endpoint', {
          module: 'botstack:api-ai'
        });
      } else {
        log.debug('Copy API.AI response to BackChat endpoint', {
          module: 'botstack:api-ai'
        });
      }
    } catch (e) {
      log.error(e, {
        module: 'botstack:api-ai'
      });
      throw e;
    }
  }
}

function processResponse(response, senderID) {
  if (lodash.get(response, 'result')) {
    log.debug('API.AI result', {
      module: 'botstack:api-ai',
      senderId: senderID,
      result: response.result
    });

    const responseText = lodash.get(response.result, 'fulfillment.speech');
    const responseData = lodash.get(response.result, 'fulfillment.data');
    const messages = lodash.get(response.result, 'fulfillment.messages');
    const action = lodash.get(response.result, 'action');
    if (lodash.get(responseData, 'facebook')) {
      // FIXME: implement this type of messages
      log.debug('Response as formatted message', {
        module: 'botstack:api-ai',
        senderId: senderID
      });
      return null;
    } else if (!lodash.isEmpty(messages)) {
      const returnData = {
        messages,
        response
      };
      return returnData;
    } else {
      return null;
    }
  } else {
    return null;
  };
}

function getApiAiResponse({ apiAiRequest, senderID, eventName, message, sessionID } = {
  eventName: null, message: null
}) {
  return new Promise((resolve, reject) => {
    apiAiRequest.on('response', (response) => {
      const logParams = {
        module: 'botstack:api-ai',
        senderId: senderID,
        sessionId: sessionID,
        response
      };

      if (eventName) {
        logParams.eventName = eventName;
      }

      if (message) {
        logParams.message = message;
      }

      log.debug('API.AI responded', logParams);

      backchatApiAiSync(response);
      resolve(processResponse(response, senderID));

      /*
      if (lodash.get(response, 'result')) {
        log.debug('API.AI result', {
          module: 'botstack:api-ai',
          senderId: senderID,
          result: response.result
        });

        const responseText = lodash.get(response.result, 'fulfillment.speech');
        const responseData = lodash.get(response.result, 'fulfillment.data');
        const messages = lodash.get(response.result, 'fulfillment.messages');
        const action = lodash.get(response.result, 'action');

        if (lodash.get(responseData, 'facebook')) {
          // FIXME: implement this type of messages
          log.debug('Response as formatted message', {
            module: 'botstack:api-ai',
            senderId: senderID
          });
          resolve(null);
        } else if (!lodash.isEmpty(messages)) {
          const returnData = {
            messages,
            response
          };
          resolve(returnData);
        }
      } else {
        resolve(null);
      }
      */
    });

    apiAiRequest.on('error', (error) => {
      log.debug(error, {
        module: 'botstack:api-ai',
        senderId: senderID
      });
      reject(error);
    });

    apiAiRequest.end();
  });
}

async function processEvent(eventName, senderID) {
  const sessionResult = await sessionStore.get(senderID);
  const sessionID = sessionResult.sessionID;

  log.debug('Process event', {
    module: 'botstack:api-ai',
    senderId: senderID,
    eventName,
    sessionId: sessionID
  });

  const apiAiRequest = apiAiService.eventRequest({
    name: eventName
  }, {
    sessionId: sessionID
  });

  const result = await getApiAiResponse({ apiAiRequest, senderID, eventName, sessionID });
  return result;
}

async function processTextMessage(message, senderID) {
  const sessionResult = await sessionStore.get(senderID);
  const sessionID = sessionResult.sessionID;

  log.debug('Process text message', {
    module: 'botstack:api-ai',
    senderId: senderID,
    message,
    sessionId: sessionID
  });

  const apiAiRequest = apiAiService.textRequest(message, {
    sessionId: sessionID
  });

  const result = await getApiAiResponse({ apiAiRequest, senderID, message, sessionID });
  return result;
}

module.exports = {
  processTextMessage,
  processEvent,
  processResponse
};
