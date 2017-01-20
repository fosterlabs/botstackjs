const request = require("request");

const BOTLYTICS_API_KEY = process.env.BOTLYTICS_API_KEY;

function logUserRequest(message, conversationId) {
    request({
        url: 'http://www.botlytics.co/api/v1/messages',
        qs: {
            token : BOTLYTICS_API_KEY
        },
        method: 'POST',
        json : {
            message: {
                text: message,
                kind: "incoming",
                conversation_identifier: conversationId
            }
        }
    }, (err, response, body) => {
        if (err) {
            console.log("Sending User Req to Botylitcs");
        } else {
            if (response.statusCode == 201) {
                console.log("Sent User Req to Botylitcs OK");
            } else {
                console.log("Sent User Req to Botylitcs Failed with " + response.statusCode);
            }
        }
    });
};

function logServerResponse(message, conversationId) {
    request({
        url: 'http://www.botlytics.co/api/v1/messages',
        qs: {
            token : BOTLYTICS_API_KEY
        },
        method: 'POST',
        json : {
            message: {
                text: message,
                kind: "outgoing",
                conversation_identifier: conversationId
            }
        }
    }, (err, response, body) => {
        if (err) {
            console.log("Sending Server Resp to Botylitcs");
        } else {
            if (response.statusCode == 201) {
                console.log("Sent Server Resp to Botylitcs OK");
            } else {
                console.log("Sent Server Resp to Botylitcs Failed with " + response.statusCode);
            }
        }
    });
};

exports.logUserRequest = logUserRequest;
exports.logServerResponse = logServerResponse;
