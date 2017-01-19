var fb = require("./fb");
var apiai = require("./api-ai.js");
var botmetrics = require('./bot-metrics.js');
var dashbot = require('dashbot')(process.env.DASHBOT_API_KEY).facebook;
var sessionStore = require('./session.js');

module.exports = function (req, res, next) {
    console.log(" ");
    console.log("===Received a message from FB");

    res.end();
    dashbot.logIncoming(req.body);

    console.log('JSON:' + JSON.stringify(req.body));

    var entries = req.body.entry;
    entries.forEach(function (entry) {
        var messages = entry.messaging;
        messages.forEach(function (message) {
            var senderID = message.sender.id;
            //create or update the session for this user
            sessionStore.set(senderID);

            // check if it is a text message
            var isTextMessage = message.message.text ? true : false;
            if (isTextMessage) {
                // get the biz from api.ai
                var text = message.message.text;
                // check for an instagram url
                
                //pass to api.ai
                console.log('Sending to A   PI.ai:' + text + ' Sender:' + senderID);

                apiai.processTextMessage(text, senderID).then(function (apiaiResp) {
                    fb.processMessagesFromApiAi(apiaiResp, senderID);

                }, function (err) {
                    fb.reply(fb.textMessage("I'm sorry, I didn't understand that"), senderID);
                    console.log("Error in api.ai response:", err);
                });
                
            } else {
                console.log("not a text message");
                console.log(message.attachments);
            }
        });
    });

    console.log("===End of FB message");
    console.log("===");
    return next();
};

