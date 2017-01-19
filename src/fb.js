var dashbot = require('dashbot')(process.env.DASHBOT_API_KEY).facebook;
var request = require("request");
var Q = require("q");

function processMessagesFromApiAi(messages, senderID) {
    for (var i = 0; i < messages.length; i++) {
        var message = messages[i];
        var replyMessage = null;

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
        }

        reply(replyMessage, senderID);        
    }
}

function structuredMessage(message) {
    var buttons = [];
    for (var i = 0; i < message.buttons.length; i++) {
        buttons.push({
            "type": "postback",
            "title": message.buttons[i].text,
            "payload": message.buttons[i].postback
        });
    }


    return {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [
                    {
                        "title": message.title,
                        "subtitle": message.subtitle,
                        "image_url": message.imageUrl,
                        "buttons": buttons
                    }
                ]
            }
        }
    }
}

//--------------------------------------------------------------------------------
function textMessage(message) {
    return {
        "text": message
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
    var quick_replies = [];

    for (var i = 0; i < apiai_qr.replies.length; i++) {
        quick_replies.push({
            "content_type": "text",
            "title": apiai_qr.replies[i],
            "payload": apiai_qr.replies[i]
        });
    }

    return {
        "text": apiai_qr.title,
        "quick_replies": quick_replies
    };
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
    var deferred = Q.defer();
    console.log("===sending message to: ", senderId);

    var reqData = {
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

    request(reqData, function (err, response, body) {
        if (err) {
            console.log("===error while sending message to FB: ", err.message);
            deferred.reject(err);
        } else {
            dashbot.logOutgoing(reqData, response.body);

            if (response.statusCode == 200) {
                console.log("===sent message to FB");
                deferred.resolve(body);
            } else {
                console.log("===Error in FB response:", response);
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