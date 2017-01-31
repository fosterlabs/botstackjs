const Promise = require('bluebird');
const co = Promise.coroutine;
const apiai = require('apiai');
const Q = require("q");
const sessionStore = require('./session.js');
const log = require('./log.js');

const APIAI_ACCESS_TOKEN = process.env.APIAI_ACCESS_TOKEN;
const APIAI_LANG = "en";
const apiAiService = apiai(APIAI_ACCESS_TOKEN);

function isDefined(obj) {
    if (typeof obj == 'undefined') {
        return false;
    }

    if (!obj) {
        return false;
    }

    return obj != null;
}

function processEvent(eventName, senderId) {

}

let processTextMessage = co(function* (message, senderId) {
    let sessionId = yield sessionStore.get(senderId);
    log.debug("Process text message", {
        module: "botstack:api-ai",
        senderId: senderId,
        message: message,
        sessionId: sessionId
    });

    let apiaiRequest = apiAiService.textRequest(message, {
        sessionId: sessionId
    });

    let apiaiResponse = new Promise((resolve, reject) => {
        apiaiRequest.on('response', response => {
            log.debug("API.AI responded", {
                module: "botstack:api-ai",
                senderId: senderId,
                message: message,
                response: response
            });
            if (isDefined(response.result)) {
                let responseText = response.result.fulfillment.speech;
                let responseData = response.result.fulfillment.data;
                let messages = response.result.fulfillment.messages;
                let action = response.result.action;
                if (isDefined(responseData) && isDefined(responseData.facebook)) {
                    log.debug("Response as formatted message", {
                        module: "botstack:api-ai",
                        senderId: senderId
                    });
                    resolve(null);
                } else if (isDefined(messages)) {
                    resolve(messages);
                }
            }
        });

        apiaiRequest.on('error', error => {
            log.error(error, {
                module: "botstack:api-ai",
                senderId: senderId
            });
            reject(error);
        });

        apiaiRequest.end();
    });

    let result = yield apiaiResponse;
    return apiaiResponse;
});

exports.processTextMessage = processTextMessage;
