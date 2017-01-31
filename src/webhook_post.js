const fb = require("./fb");
const apiai = require("./api-ai.js");
const botmetrics = require('./bot-metrics.js');
const dashbot = require('dashbot')(process.env.DASHBOT_API_KEY).facebook;
const sessionStore = require('./session.js');
const log = require('./log.js');

function processWelcomeMessage(messageText, senderID) {
    
}

module.exports = (req, res, next) => {
    console.log(" ");
    console.log("===Received a message from FB");

    res.end();
    dashbot.logIncoming(req.body);

    console.log('JSON:' + JSON.stringify(req.body));

    let entries = req.body.entry;
    entries.forEach((entry) => {
        let messages = entry.messaging;
        messages.forEach((message) => {
            let senderID = message.sender.id;
            //create or update the session for this user
            sessionStore.set(senderID);

            // check if it is a text message
            let isTextMessage = message.message.text ? true : false;
            if (isTextMessage) {
                // get the biz from api.ai
                let text = message.message.text;
                // check for an instagram url

                //pass to api.ai
                console.log('Sending to API.ai:' + text + ' Sender:' + senderID);

                apiai.processTextMessage(text, senderID).then((apiaiResp) => {
                    fb.processMessagesFromApiAi(apiaiResp, senderID);
                }, (err) => {
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

