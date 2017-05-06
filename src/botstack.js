"use strict";

const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const lodash = require('lodash');
const restify = require('restify');
const fb = require("./fb");
const botmetrics = require('./bot-metrics.js');
const apiai = require('./api-ai.js');
const log = require('./log.js');

process.on('unhandledRejection', (reason, p) => {
    // console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.log(`Caught exception: ${err}`);
});

const sessionStore = require('./session.js')();
const state = require('./state.js')();
const db = require('./dynamodb.js');
const s3 = require('./s3.js');
const co = Promise.coroutine;
const { BotStackEmitterInit, BotStackCheck, BotStackEvents } = require('./events.js');

let conf = {};
const envVars = [
    { name: "FB_PAGE_ACCESS_TOKEN", required: true, module: ["fb"] },
    { name: "FB_VERIFY_TOKEN", required: true, module: ["fb"] },
    { name: "APIAI_ACCESS_TOKEN", required: true, module: ["fb"] },
    { name: "AWS_ACCESS_KEY", required: false, module: ["s3"] },
    { name: "AWS_SECRET_KEY", required: false, module: ["s3"] },
    { name: "BUCKET_NAME", required: false, module: ["s3"] },
    { name: "BOTLYTICS_API_KEY", required: false, module: ["botlyptics"] },
    { name: "BOTMETRICS_TOKEN", required: false, module: ["botmetrics"] },
    { name: "DASHBOT_API_KEY", required: false, module: ["dashbot"] },
    { name: "MONGODB_URI", required: false, module: ["db"] },
    { name: "REDIS_URL", required: false, module: ["session"] }
];
let enabledModules = [];

function checkConfig() {
    const basePath = path.dirname(require.main.filename);
    const configPath = path.join(basePath, "conf/conf.json");
    if (fs.existsSync(configPath)) {
        conf = require(configPath);
    }
}

function checkEnvs() {
    for (const envVar of envVars) {
        if (envVar.name in process.env) {
            enabledModules = lodash.union(enabledModules, envVar.module);
        }
    }
    let requiredModules = lodash.flatten(lodash.map(lodash.filter(envVars, x => x.required), x => x.module));
    enabledModules = lodash.union(enabledModules, requiredModules);

    let checkVars = [];
    for (let c of enabledModules) {
        let temp = lodash.map(lodash.filter(envVars, x => lodash.includes(x.module, c)), x => x.name);
        checkVars = lodash.union(checkVars, temp);
    }

    let notFoundEnvs = [];
    for (const e of checkVars) {
        if (!(e in process.env)) {
            notFoundEnvs.push(e);
        }
    }
    if (notFoundEnvs.length > 0) {
        throw new Error("Not found env variables: " + notFoundEnvs.join(","));
    }
}

class BotStack {
    constructor(botName) {
        botName = typeof(botName) !== 'undefined' ? botName: "default bot";
        this.botName = botName;
        this.server = restify.createServer();

        checkConfig();
        checkEnvs();

        if ('subscribeTo' in conf) {
            this.subscriber = require('./redis');
            this.subscriber.on("message", (channel, message) => {
                this.subscription(message);
            });
            this.subscriber.subscribe(conf.subscribeTo);
            log.debug("Subscribed to Redis channel", {
                module: "botstack:constructor",
                channel: conf.subscribeTo
            });
        }

        if ('BOTSTACK_STATIC' in process.env) {
            if (!('BOTSTACK_URL' in process.env)) {
                throw new Error("BOTSTACK_URL not found");
                return;
            } else {
                this.server.get(/\/public\/?.*/, restify.serveStatic({
                    directory: process.env.BOTSTACK_STATIC
                }));
            }
        }

        this.server.use(restify.queryParser());
        this.server.use(restify.bodyParser());

        this.events = BotStackEmitterInit;
        this.state = state;

        // utils
        this.fb = fb;
        this.apiai = apiai;
        this.s3 = s3;
        this.log = log;

        if (Object.keys(conf).length == 0) {
            log.debug("Started with default config (no configuration file found)", { module: "botstack:constructor"});
        } else {
            log.debug("Custom config file loaded", { module: "botstack:constructor"});
        }

        if ('getStartedButtonText' in conf) {
            this.fb.getStartedButton(conf.getStartedButtonText).then(x => {
                log.debug("Started button done", { module: "botstack:constructor", result: x.result});
            });
        } else {
            this.fb.getStartedButton().then(x => {
                log.debug("Started button done", { module: "botstack:constructor", result: x.result});
            });
        };

        if ('persistentMenu' in conf) {
            this.fb.persistentMenu(conf.persistentMenu).then(x => {
                log.debug("Persistent menu done", { module: "botstack:constructor", result: x.result});
            });
        };

        if ('welcomeText' in conf) {
            this.fb.greetingText(conf.welcomeText).then(x => {
                log.debug("Welcome text done", { module: "botstack:constructor", result: x.result});
            });
        };

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

    subscription(message) {
        log.debug("Subscription method not implemented", {
            module: "botstack:subscription"
        });
    }

    textMessage(message, senderID) {
        co(function* (){
            let text = message.message.text;
            botmetrics.logUserRequest(text, senderID);
            log.debug("Process text message", {
                module: "botstack:textMessage",
                senderId: senderID,
                message: message
            });
            if (BotStackCheck("textMessage")) {
                BotStackEvents.emit("textMessage", {
                    senderID,
                    message
                });
                return;
            }
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
                        const isEcho = lodash.get(message, 'message.is_echo') ? true : false;
                        if (isEcho) {
                            continue;
                        }
                        let isNewSession = yield sessionStore.checkExists(senderID);
                        const isPostbackMessage = message.postback ? true : false;
                        const isQuickReplyPayload = lodash.get(message, 'message.quick_reply.payload') ? true : false;
                        const isTextMessage = lodash.get(message, 'message.text') ? true : false;
                        log.debug("Detect kind of message", {
                            module: "botstack:webhookPost",
                            senderID,
                            isNewSession,
                            isPostbackMessage,
                            isQuickReplyPayload,
                            isTextMessage
                        });
                        yield sessionStore.set(senderID);
                        if (isQuickReplyPayload) {
                            self.quickReplyPayload(message, senderID);
                        } else if (isTextMessage) {
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
        };
    }

    welcomeMessage(messageText, senderID) {
        botmetrics.logUserRequest(messageText, senderID);
        log.debug("Process welcome message", {
            module: "botstack:welcomeMessage",
            senderId: senderID
        });
        co(function* (){
            if (BotStackCheck("welcomeMessage")) {
                BotStackEvents.emit("welcomeMessage", {
                    senderID,
                    messageText
                });
                return;
            };
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
            if (BotStackCheck("postbackMessage")) {
                BotStackEvents.emit("postbackMessage", {
                    senderID,
                    postback
                });
                return;
            };
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

    quickReplyPayload(message, senderID) {
        const text = lodash.get(message, 'message.quick_reply.payload');
        log.debug("Process quick reply payload", {
            module: "botstack: quickReplyPayload",
            senderId: senderID,
            text
        });
        botmetrics.logUserRequest(text, senderID);
        if (BotStackCheck("quickReplyPayload")) {
            BotStackEvents.emit("quickReplyPayload", {
                senderID,
                text,
                message
            });
            return;
        }
        throw new Error("Not implemented");
    }

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
