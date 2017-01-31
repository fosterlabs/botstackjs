"use strict";

const Promise = require('bluebird');
const restify = require('restify');
const fb = require("./fb");
const botmetrics = require('./bot-metrics.js');
const apiai = require('./api-ai.js');
const log = require('./log.js');
const sessionStore = require('./session.js');
const db = require('./dynamodb.js');
const co = Promise.coroutine;

class BotStack {
    constructor(botName) {
        botName = typeof(botName) !== 'undefined' ? botName: "default bot";
        this.botName = botName;
        this.server = restify.createServer();
        this.server.use(restify.queryParser());
        this.server.use(restify.bodyParser());

        this.server.get('/', (req, res, next) => {
            res.send('Nothing to see here...');
        });

        this.server.get('/webhook/', (req, res, next) => {
            let token = req.query.hub.verify_token;
            if (token === process.env.FB_VERIFY_TOKEN) {
                res.write(req.query.hub.challenge);
                res.end();
            } else {
                res.send("Error, wrong validation token");
            }
            return next();
        });

        this.server.post('/webhook/', this._webhookPost);

        this.server.post('/apiaidb/', (req, res, next) => {
            res.json({
                speech: req.body.result.fulfillment.speech,
                displayText: req.body.result.fulfillment.speech,
                source: this.botName
            });
            res.end();
            log.debug("Received a database hook from API.AI", {
                module: "botstack:apiaidb"
            });
            //add to db
            if(req.body) {
                db.logApiaiObject(req.body);
            } else {
                log.debug("No body to put in DB", {
                    module: "botstack:apiaidb"
                });
            }
            return next();
        });
    };

    _webhookPost(req, res, next) {
        res.end();
        let entries = req.body.entry;
        entries.forEach(entry => {
            let messages = entry.messaging;
            messages.forEach(message => {
                let senderID = message.sender.id;
                let isNewSession = sessionStore.checkExists(senderID);
                const isPostbackMessage = message.postback ? true : false;
                let isTextMessage = false;
                if ('message' in message && 'text' in message.message) {
                    isTextMessage = true;
                }
                sessionStore.set(senderID);
                if (isTextMessage) {
                    if (message.message.text == "Get Started") {
                        this.welcomeMessage(message.message.text, senderID);
                    } else {
                        this.textMessage(message, senderID);
                    }
                } else if (isPostbackMessage) {
                    if (message.postback.payload == "Get Started") {
                        this.welcomeMessage(message.postback.payload, senderID);
                    } else {
                        this.postbackMessage(message, senderID);
                    }
                } else {
                    this.fallback(message, senderID);
                }
            });
        });
    }

    welcomeMessage(messageText, senderID) {
        botmetrics.logUserRequest(messageText, senderID);
        log.debug("Process welcome message", {
            module: "botstack:welcomeMessage",
            senderId: senderID
        });
        co(function* (){
            try {
                let apiaiResp = yield apiai.processEvent("FACEBOOK_WELCOME", senderID);
                log.debug("Facebook welcome result", {
                    module: "botstack:welcomeMessage",
                    senderId: senderID
                });
                fb.processMessagesFromApiAi(apiaiResp, senderID);
                botmetrics.logServerResponse(apiaiResp, senderID);
            } catch (err) {
                log.error(err, {
                    module: "botstack:welcomeMessage",
                    senderId: senderID,
                    reason: "Error in API.AI response"
                });
                fb.reply(fb.textMessage("I'm sorry, I didn't understand that"), senderID);
                botmetrics.logServerResponse(err, senderID);
            }
        })();
    };

    textMessage(message, senderID) {
        co(function* (){
            let text = message.message.text;
            botmetrics.logUserRequest(text, senderID);
            log.debug("Process text message", {
                module: "botstack:textMessage",
                senderId: senderID,
                message: message
            });
            log.debug("Sending to API.AI", {
                module: "botstack:textMessage",
                senderId: senderID,
                text: text
            });
            try {
                let apiaiResp = yield apiai.processTextMessage(text, senderID);
                fb.processMessagesFromApiAi(apiaiResp, senderID);
                botmetrics.logServerResponse(apiaiResp, senderID);
            } catch (err) {
                fb.reply(fb.textMessage("I'm sorry, I didn't understand that"), senderID);
                log.error(err, {
                    module: "botstack:textMessage",
                    senderId: senderID,
                    reason: "Error on API.AI request"
                });
                botmetrics.logServerResponse(err, senderID);
            }
        })();
    };

    postbackMessage(postback, senderID) {
        co(function* () {
            let text = postback.postback.payload;
            log.debug("Process postback", {
                module: "botstack:postbackMessage",
                senderId: senderID,
                postback: postback,
                text: text
            });
            botmetrics.logUserRequest(text, senderID);
            log.debug("Sending to API.AI", {
                module: "botstack:postbackMessage",
                senderId: senderID,
                text: text
            });
            try {
                let apiaiResp = yield apiai.processTextMessage(text, senderID);
                fb.processMessagesFromApiAi(apiaiResp, senderID);
                botmetrics.logServerResponse(apiaiResp, senderID);
            } catch (err) {
                log.error(err, {
                    module: "botstack:postbackMessage",
                    senderId: senderID,
                    reason: "Error in API.AI response"
                });
                fb.reply(fb.textMessage("I'm sorry, I didn't understand that"), senderID);
                botmetrics.logServerResponse(err, senderID);
            }
        })();
    };

    fallback(message, senderID) {
        log.debug("Unknown message", {
            module: "botstack:fallback",
            senderId: senderID
        });
        fb.reply(fb.textMessage("I'm sorry, I didn't understand that"), senderID);
    };

    startServer() {
        const port = process.env.PORT || 1337;
        this.server.listen(port, () => {
            console.log("listening on port:%s %s %s", port, this.server.name, this.server.url);
        });
    }
}

module.exports = BotStack;
