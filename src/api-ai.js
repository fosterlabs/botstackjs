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

function processTextMessage(message, senderId) {
    console.log("api-ai: Processing " + message);

    let deferred = Q.defer();
    let sessionId = sessionStore.get(senderId);
    console.log("SessionId:" + sessionId);

    let apiaiRequest = apiAiService.textRequest(message, {
        sessionId: sessionId
    });

    apiaiRequest.on('response', (response) => {
        console.log("api-ai Responded");
        if (isDefined(response.result)) {
            let responseText = response.result.fulfillment.speech;
            let responseData = response.result.fulfillment.data;
            let messages = response.result.fulfillment.messages;
            let action = response.result.action;

            if (isDefined(responseData) && isDefined(responseData.facebook)) {
                console.log('Response as formatted message');
            } else if (isDefined(messages)) {
                deferred.resolve(messages);
            }
        }
    });

    apiaiRequest.on('error', (error) => {
        console.error(error);
        deferred.reject(error);
    });

    apiaiRequest.end();
    return deferred.promise;
};

exports.processTextMessage = processTextMessage;
