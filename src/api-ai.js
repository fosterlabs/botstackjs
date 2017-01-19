const apiai = require('apiai');
var Q = require("q");
var sessionStore = require('./session.js'); 

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

function processTextMessage(message, senderId) {
    console.log("api-ai: Processing " + message);
    
    var deferred = Q.defer();
    var sessionId = sessionStore.get(senderId);
    console.log("SessionId:" + sessionId);

    var apiaiRequest = apiAiService.textRequest(message, {
        sessionId: sessionId 
    });
    
    apiaiRequest.on('response', function (response) {
        console.log("api-ai Responded");
        if (isDefined(response.result)) {
            var responseText = response.result.fulfillment.speech;
            var responseData = response.result.fulfillment.data;
            var messages = response.result.fulfillment.messages;
            var action = response.result.action;
            
            if (isDefined(responseData) && isDefined(responseData.facebook)) {
                console.log('Response as formatted message');
                
            } else if (isDefined(messages)) {
                deferred.resolve(messages);
            }
        }
    });
    
    apiaiRequest.on('error', function (error) {
        console.error(error);
        deferred.reject(error);
    });

    apiaiRequest.end();
    return deferred.promise;
};

exports.processTextMessage = processTextMessage;