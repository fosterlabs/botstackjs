const dashbot = require('dashbot')(process.env.DASHBOT_API_KEY).facebook;
const request = require('request');
const rp = require('request-promise');
const Promise = require('bluebird');
const co = Promise.coroutine;
const log = require("./log.js");
const Q = require('q');

let processMessagesFromApiAi = co(function* (apiaiResponse, senderID) {
    for (let message of apiaiResponse.messages) {
        let replyMessage = null;
        log.debug("Process message from API.AI", {
            module: "botstack:fb",
            message: message,
            messageType: message.type
        });
        switch (message.type) {
            case 0: // text response
                replyMessage = textMessage(message.speech);
                break;
            case 1: // image response
                replyMessage = structuredMessage(message);
                break;
            case 2: // card response
                replyMessage = quickReply(message);
                break;
            case 3: // quick reply
                replyMessage = imageReply(message);
                break;
            case 4: // custom payload
                replyMessage = customMessageReply(message);
                break;
        }
        reply(replyMessage, senderID);
    }
});


function structuredMessage(message) {
    let buttons = [];
    for (let button of message.buttons) {
        buttons.push({
            "type": "postback",
            "title": button.text,
            "payload": button.postback
        });
    }

    let element = {
        "title": message.title,
        "subtitle": message.subtitle,
        "image_url": message.imageUrl
    }

    if (buttons.length > 0) {
        element["buttons"] = buttons
    }

    return {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [element]
            }
        }
    }
};

//--------------------------------------------------------------------------------
function textMessage(message) {
    if (message == "") {
        return null;
    } else {
        return {
            "text": message
        }
    }
}

//pass into this method the `messages` section of the api.ai response
//message: {
//  title: 'Yes',
//  replies" [
//   "No", "Maybe"
//  ],
//  type: 2
// }
function quickReply(apiai_qr) {
    let quick_replies = [];

    for (let repl of apiai_qr.replies) {
        quick_replies.push({
            "content_type": "text",
            "title": repl,
            "payload": repl
        });
    }

    return {
        "text": apiai_qr.title,
        "quick_replies": quick_replies
    };
}

function imageReply(message) {
    return {
        attachment: {
            type: "image",
            payload: {
                url: message.imageUrl || message.url
            }
        }
    }
};

function videoReply(message) {
    return {
        attachment: {
            type: "video",
            payload: {
                url: message.url
            }
        }
    }
}

function audioReply(message) {
    return {
        attachment: {
            type: "audio",
            payload: {
                url: message.url
            }
        }
    }
}

function fileReply(message) {
    return {
        attachment: {
            type: "file",
            payload: {
                url: message.url
            }
        }
    }
}

function customMessageReply(message) {
    if ('payload' in message) {
        if ('facebook' in message.payload) {
            if ('attachment' in message.payload.facebook) {
                switch (message.payload.facebook.attachment.type) {
                    case "video":
                        return videoReply(message.payload.facebook.attachment.payload);
                        break;
                    case "audio":
                        return audioReply(message.payload.facebook.attachment.payload);
                        break;
                    case "file":
                        return fileReply(message.payload.facebook.attachment.payload);
                        break;
                    case "image":
                        return imageReply(message.payload.facebook.attachment.payload);
                        break;
                }
            }
        }
    }
}

let setThreadSettings = co(function* (data, method) {
    method = typeof(method) !== 'undefined' ? method: "POST";
    let reqData = {
        url: "https://graph.facebook.com/v2.6/me/thread_settings",
        qs: {
            access_token: process.env.FB_PAGE_ACCESS_TOKEN
        },
        resolveWithFullResponse: true,
        method: method,
        json: data
    };
    try {
        let response = yield rp(reqData);
        if (response.statusCode == 200) {
            log.debug("Sent settings to Facebook", {
                module: "botstack:fb"
            });
            return response.body;
        } else {
            log.error("Error in Facebook response", {
                module: "botstack:fb", response: response.body
            });
            throw new Error("Error in Facebook response: " + response.body);
        }
    } catch (e) {
        log.error(e, {
            module: "botstack:fb"
        });
        throw e;
    }
});

function greetingText(text) {
    log.debug("Sending greeting text", {
        module: "botstack:fb"
    });
    let data = {
        setting_type: "greeting",
        greeting: {
            text: text
        }
    }
    return setThreadSettings(data);
}

function getStartedButton(payload) {
    payload = typeof(payload) !== 'undefined' ? payload: "Get Started";
    log.debug("Sending started button", {
        module: "botstack:fb"
    });
    let data = {
        setting_type: "call_to_actions",
        thread_state: "new_thread",
        call_to_actions: [
            { payload: payload }
        ]
    }
    return setThreadSettings(data);
}

/*
[{ type: "postback", title: "Yes", payload: "Yes" },
 { type: "postback", title: "Help", payload: "Help" }]
*/
function persistentMenu(call_to_actions) {
    log.debug("Sending persistent menu settings", {
        module: "botstack:fb"
    });
    let data = {
        setting_type: "call_to_actions",
        thread_state: "existing_thread",
        call_to_actions: call_to_actions
    };
    return setThreadSettings(data);
}

function deletePersistentMenu() {
    log.debug("Delete persistent menu settings", {
        module: "botstack:fb"
    });
    let data = {
        setting_type: "call_to_actions",
        thread_state: "existing_thread"
    }
    return setThreadSettings(data, "DELETE");
}


function imageCard(thumbUrl, downloadUrl, instaUrl, authName) {
    return {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [
                    {
                        "title": authName + " on Instagram",
                        "item_url": instaUrl,
                        "image_url": thumbUrl,
                        "buttons": [
                            {
                                "type": "web_url",
                                "url": downloadUrl,
                                "title": "Download"
                            },
                            {
                                "type": "element_share"
                            }
                        ]
                    }]
            }
        }
    }
}

function youtubeVideoCard(thumbUrl, downloadUrl, originalUrl) {
    return {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [
                    {
                        "title": "Youtube Video",
                        "item_url": originalUrl,
                        "image_url": thumbUrl,
                        "buttons": [
                            {
                                "type": "web_url",
                                "url": downloadUrl,
                                "title": "Download"
                            },
                            {
                                "type": "element_share"
                            }
                        ]
                    }]
            }
        }
    }
}

function imageAttachment(thumbUrl) {
    return {
        "attachment": {
            "type": "image",
            "payload": {
                "url": thumbUrl
            }
        }
    }
}

function genericMessage() {
    return {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "First card",
                    "subtitle": "Element #1 of an hscroll",
                    "image_url": "http://messengerdemo.parseapp.com/img/rift.png",
                    "buttons": [{
                        "type": "web_url",
                        "url": "https://www.messenger.com",
                        "title": "web url"
                    }, {
                        "type": "postback",
                        "title": "Postback",
                        "payload": "Payload for first element in a generic bubble",
                    }],
                }, {
                    "title": "Second card",
                    "subtitle": "Element #2 of an hscroll",
                    "image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
                    "buttons": [{
                        "type": "postback",
                        "title": "Postback",
                        "payload": "Payload for second element in a generic bubble",
                    }],
                }]
            }
        }
    }
}
//--------------------------------------------------------------------------------
function reply(message, senderId) {
    if (message == null) {
        log.debug("This message ignored to send", {
            module: "botstack:fb",
            senderId: senderId,
            message: message
        });
        return;
    }
    let deferred = Q.defer();
    log.debug("Sending message", {
        module: "botstack:fb",
        senderId: senderId,
        message: message
    });

    let reqData = {
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: process.env.FB_PAGE_ACCESS_TOKEN
        },
        method: 'POST',
        json: {
            recipient: {
                id: senderId
            },
            message: message
        }
    };

    request(reqData, (err, response, body) => {
        if (err) {
            log.error(err, {
                module: "botstack:fb",
                reason: "Error while sending message to FB"
            });
            deferred.reject(err);
        } else {
            dashbot.logOutgoing(reqData, response.body);

            if (response.statusCode == 200) {
                log.debug("Send message to Facebook", {
                    module: "botstack:fb"
                });
                deferred.resolve(body);
            } else {
                log.error("Error in Facebook response", {
                    module: "botstack:fb",
                    response: body
                });
                deferred.reject(body);
            }
        }
    });
    return deferred.promise;
}
//--------------------------------------------------------------------------------
exports.processMessagesFromApiAi = processMessagesFromApiAi;
exports.textMessage = textMessage;
exports.quickReply = quickReply;
exports.genericMessage = genericMessage;
exports.imageCard = imageCard;
exports.imageAttachment = imageAttachment;
exports.reply = reply;
exports.youtubeVideoCard = youtubeVideoCard;
exports.greetingText = greetingText;
exports.getStartedButton = getStartedButton;
exports.persistentMenu = persistentMenu;
