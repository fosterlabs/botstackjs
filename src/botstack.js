"use strict";

const Promise = require('bluebird');
const restify = require('restify');
const fb = require("./fb");
const botmetrics = require('./bot-metrics.js');
const apiai = require('./api-ai.js');
const log = require('./log.js');
const sessionStore = require('./session.js');
const db = require('./dynamodb.js');
const s3 = require('./s3.js');
const co = Promise.coroutine;

class BotStack {
    constructor(botName) {
        botName = typeof(botName) !== 'undefined' ? botName: "default bot";
        this.botName = botName;
        this.server = restify.createServer();
        this.server.use(restify.queryParser());
        this.server.use(restify.bodyParser());

        // utils
        this.fb = fb;
        this.apiai = apiai;
        this.s3 = s3;

        this.fb.getStartedButton();

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

        this.server.post('/webhook/', this._webhookPost(this));

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

    _webhookPost(context) {
        let self = context;
        return function(req, res, next) {
            co(function* (){
                res.end();
                let entries = req.body.entry;
                for (let entry of entries) {
                    let messages = entry.messaging;
                    for (let message of messages) {
                        let senderID = message.sender.id;
                        let isNewSession = yield sessionStore.checkExists(senderID);
                        const isPostbackMessage = message.postback ? true : false;
                        let isTextMessage = false;
                        if ('message' in message && 'text' in message.message) {
                            isTextMessage = true;
                        }
                        yield sessionStore.set(senderID);
                        if (isTextMessage) {
                            if (message.message.text == "Get Started") {
                                self.welcomeMessage(message.message.text, senderID);
                            } else {
                                self.textMessage(message, senderID);
                            }
                        } else if (isPostbackMessage) {
                            if (message.postback.payload == "Get Started") {
                                self.welcomeMessage(message.postback.payload, senderID);
                            } else {
                                self.postbackMessage(message, senderID);
                            }
                        } else {
                            self.fallback(message, senderID);
                        }
                    }
                }
            })();
        }
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
            senderId: senderID,
            message: message
        });
        //fb.reply(fb.textMessage("I'm sorry, I didn't understand that"), senderID);
    };

    startServer() {
        const port = process.env.PORT || 1337;
        this.server.listen(port, () => {
            console.log(`Bot '${this.botName}' is ready`);
            console.log("listening on port:%s %s %s", port, this.server.name, this.server.url);
        });
    }
}

module.exports = BotStack;
