const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const lodash = require('lodash');
const restify = require('restify');
const rp = require('request-promise');

const fb = require('./fb');
const apiai = require('./api-ai');
const log = require('./log');
const smooch = require('./smooch');

/*
process.on('unhandledRejection', (reason, p) => {
    // console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.log(`Caught exception: ${err}`);
});
*/

const sessionStore = require('./session')();
const state = require('./state')();
const db = require('./dynamodb');
const s3 = require('./s3');

const { BotStackEmitterInit, BotStackCheck, BotStackEvents } = require('./events');

let conf = {};
const envVars = [
    { name: 'FB_PAGE_ACCESS_TOKEN', required: true, module: ['fb'] },
    { name: 'FB_VERIFY_TOKEN', required: true, module: ['fb'] },
    { name: 'APIAI_ACCESS_TOKEN', required: true, module: ['api-ai'] },
    { name: 'AWS_ACCESS_KEY', required: false, module: ['s3'] },
    { name: 'AWS_SECRET_KEY', required: false, module: ['s3'] },
    { name: 'BUCKET_NAME', required: false, module: ['s3'] },
    { name: 'BOTLYTICS_API_KEY', required: false, module: ['botlyptics'] },
    { name: 'BOTMETRICS_TOKEN', required: false, module: ['botmetrics'] },
    { name: 'DASHBOT_API_KEY', required: false, module: ['dashbot'] },
    { name: 'MONGODB_URI', required: false, module: ['db'] },
    { name: 'REDIS_URL', required: false, module: ['session'] },
    { name: 'SMOOCH_KEY_ID', required: false, module: ['smooch'] },
    { name: 'SMOOCH_SECRET', required: false, module: ['smooch'] },
    { name: 'SMOOCH_SCOPE', required: false, module: ['smooch'] }
];
let enabledModules = [];

function checkConfig() {
  const basePath = path.dirname(require.main.filename);
  const configPath = path.join(basePath, 'conf/conf.json');
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
  const requiredModules = lodash.flatten(lodash.map(lodash.filter(envVars, x => x.required), x => x.module));
  enabledModules = lodash.union(enabledModules, requiredModules);

  let checkVars = [];
  for (const c of enabledModules) {
    const temp = lodash.map(lodash.filter(envVars, x => lodash.includes(x.module, c)), x => x.name);
    checkVars = lodash.union(checkVars, temp);
  }

  const notFoundEnvs = [];
  for (const e of checkVars) {
    if (!(e in process.env)) {
      console.log(e);
      notFoundEnvs.push(e);
    }
  }

    // ???
    // const preNotFoundEnvs = lodash.cloneDeep(notFoundEnvs);
    /*
    const preNotFoundEnvs = lodash.filter(notFoundEnvs, (x) => {
        const fbMissed = lodash.includes(lodash.get(lodash.find(envVars, { name: x }), 'module'), 'fb');
        const smoochKeys = lodash.map(lodash.filter(envVars, { module: ['smooch'] }), 'name');
        const smoochExists = lodash.intersection(smoochKeys, Object.keys(process.env));
        console.log('fbMissed: '); console.log(fbMissed);
        console.log('Smooch exists:'); console.log(smoochExists);

        if ((fbMissed) && (smoochKeys.length === smoochExists.length)) {
            console.log('FB replaced by SMOOCH');
            return false;
        } else {
            return true;
        }
    });
    notFoundEnvs = lodash.cloneDeep(preNotFoundEnvs);
    //
    */

  if (notFoundEnvs.length > 0) {
    throw new Error(`Not found env variables: ${notFoundEnvs.join(',')}`);
  }
}

class BotStack {

  constructor(botName) {
    botName = typeof (botName) !== 'undefined' ? botName : 'default bot';
    this.botName = botName;
    this.server = restify.createServer();

    checkConfig();
    checkEnvs();

    if ('subscribeTo' in conf) {
      this.subscriber = require('./redis');
      this.subscriber.on('message', (channel, message) => {
        this.subscription(message);
      });
      this.subscriber.subscribe(conf.subscribeTo);
      log.debug('Subscribed to Redis channel', {
        module: 'botstack:constructor',
        channel: conf.subscribeTo
      });
    }

    if ('BOTSTACK_STATIC' in process.env) {
      if (!('BOTSTACK_URL' in process.env)) {
        throw new Error('BOTSTACK_URL not found');
      }
      this.server.get(/\/public\/?.*/, restify.serveStatic({
        directory: process.env.BOTSTACK_STATIC
      }));
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
      log.debug('Started with default config (no configuration file found)', { module: 'botstack:constructor' });
    } else {
      log.debug('Custom config file loaded', { module: 'botstack:constructor' });
    }

    if ('getStartedButtonText' in conf) {
      this.fb.getStartedButton(conf.getStartedButtonText).then((x) => {
        log.debug('Started button done', { module: 'botstack:constructor', result: x.result });
      });
    } else {
      this.fb.getStartedButton().then((x) => {
        log.debug('Started button done', { module: 'botstack:constructor', result: x.result });
      });
    }

    if ('persistentMenu' in conf) {
      this.fb.persistentMenu(conf.persistentMenu).then((x) => {
        log.debug('Persistent menu done', { module: 'botstack:constructor', result: x.result });
      });
    }

    if ('welcomeText' in conf) {
      this.fb.greetingText(conf.welcomeText).then((x) => {
        log.debug('Welcome text done', { module: 'botstack:constructor', result: x.result });
      });
    }

    this.server.get('/', (req, res, next) => {
      res.send('Nothing to see here...');
    });

    this.server.get('/webhook/', (req, res, next) => {
      const token = req.query.hub.verify_token;
      if (token === process.env.FB_VERIFY_TOKEN) {
        res.write(req.query.hub.challenge);
        res.end();
      } else {
        res.send('Error, wrong validation token');
      }
      return next();
    });

    this.server.post('/webhook/', this._webhookPost(this));

    this.server.post('/smooch/webhook/', this._smoochWebhook(this));

    this.server.post('/apiaidb/', (req, res, next) => {
      res.json({
        speech: req.body.result.fulfillment.speech,
        displayText: req.body.result.fulfillment.speech,
        source: this.botName
      });
      res.end();
      log.debug('Received a database hook from API.AI', {
        module: 'botstack:apiaidb'
      });
            // add to db
      if (req.body) {
        db.logApiaiObject(req.body);
      } else {
        log.debug('No body to put in DB', {
          module: 'botstack:apiaidb'
        });
      }
      return next();
    });
  }

  subscription(message) {
    log.debug('Subscription method not implemented', {
      module: 'botstack:subscription'
    });
  }

  async geoLocationMessage(message, senderID) {
    log.debug('Process GEO location message', {
      module: 'botstack:geoLocationMessage',
      senderId: senderID,
      message
    });
    if (BotStackCheck('geoLocationMessage')) {
      BotStackEvents.emit('geoLocationMessage', {
        senderID,
        message
      });
    }
  }

  async textMessage(message, senderID, dontUseEvents = false) {
    const text = message.message.text;
        // botmetrics.logUserRequest(text, senderID);
    log.debug('Process text message', {
      module: 'botstack:textMessage',
      senderId: senderID,
      message
    });
    if (!dontUseEvents) {
      if (BotStackCheck('textMessage')) {
        BotStackEvents.emit('textMessage', {
          senderID,
          message
        });
        return;
      }
    }
    log.debug('Sending to API.AI', {
      module: 'botstack:textMessage',
      senderId: senderID,
      text
    });
    try {
      const apiaiResp = await apiai.processTextMessage(text, senderID);
      await fb.processMessagesFromApiAi(apiaiResp, senderID);
            // botmetrics.logServerResponse(apiaiResp, senderID);
    } catch (err) {
      await fb.reply(fb.textMessage("I'm sorry, I didn't understand that"), senderID);
      log.error(err, {
        module: 'botstack:textMessage',
        senderId: senderID,
        reason: 'Error on API.AI request'
      });
            // botmetrics.logServerResponse(err, senderID);
    }
  }

  _smoochWebhook(context) {
    log.debug('Smooch API endpoint ready', {
      module: 'botstack:smoochWebhook'
    });
    const self = context;
    return async function (req, res, next) {
      res.end();
      for (const msg of lodash.get(req.body, 'messages', [])) {
                // message schema
                // https://docs.smooch.io/rest/?javascript#schema44
        if (msg.role !== 'appUser') {
          continue;
        }
        log.debug('New message from Smooch endpoint', {
          module: 'botstack:smoochWebhook',
          message: msg
        });
        const text = lodash.get(msg, 'text');
        const authorID = lodash.get(msg, 'authorId');
        let apiAiResponse = null;
        let result = null;
        try {
          apiAiResponse = await self.apiai.processTextMessage(text, authorID);
          result = await smooch.processMessagesFromApiAi(apiAiResponse, authorID);
        } catch (err) {
          log.error(err, {
            module: 'botstack:smoochWebhook'
          });
        }
      }
    };
  }

  async _syncFbMessageToBackChat(req) {
    if (process.env.BACKCHAT_FB_SYNC_URL) {
      const reqData = {
        url: process.env.BACKCHAT_FB_SYNC_URL,
        resolveWithFullResponse: true,
        method: 'POST',
        json: req.body
      };
      let result = null;
      try {
        result = await rp(reqData);
        if (result.statusCode != 200) {
          log.warn('Something wrong with BackChat endpoint', {
            module: 'botstack'
          });
        } else {
          log.debug('Copy FB response to BackChat endpoint', {
            module: 'botstack'
          });
        }
      } catch (err) {
        log.error(err, {
          module: 'botstack'
        });
        throw err;
      }
    }
  }

  _webhookPost(context) {
    const self = context;
    return async function (req, res, next) {
      res.end();
      await this._syncFbMessageToBackChat(req);
      const entries = req.body.entry;
      for (const entry of entries) {
        const messages = entry.messaging;
        for (const message of messages) {
          const senderID = message.sender.id;
          const isEcho = !!lodash.get(message, 'message.is_echo');
          if (isEcho) {
            continue;
          }
          log.debug('New Facebook message', {
            module: 'botstack:webhookPost',
            message
          });
          const isNewSession = await sessionStore.checkExists(senderID);
          const isPostbackMessage = !!message.postback;
          const isQuickReplyPayload = !!lodash.get(message, 'message.quick_reply.payload');
          const isTextMessage = !!(!isQuickReplyPayload && lodash.get(message, 'message.text'));
          const isGeoLocationMessage = !!lodash.get(message, 'message.attachments[0].payload.coordinates');
          log.debug('Detect kind of message', {
            module: 'botstack:webhookPost',
            senderID,
            isNewSession,
            isPostbackMessage,
            isQuickReplyPayload,
            isTextMessage,
            isGeoLocationMessage
          });
          await sessionStore.set(senderID);
          if (isQuickReplyPayload) {
            await self.quickReplyPayload(message, senderID);
          } else if (isGeoLocationMessage) {
            await self.geoLocationMessage(message, senderID);
          } else if (isTextMessage) {
            if (message.message.text == 'Get Started') {
              await self.welcomeMessage(message.message.text, senderID);
            } else {
              await self.textMessage(message, senderID);
            }
          } else if (isPostbackMessage) {
            if (message.postback.payload == 'Get Started') {
              await self.welcomeMessage(message.postback.payload, senderID);
            } else {
              await self.postbackMessage(message, senderID);
            }
          } else {
            await self.fallback(message, senderID);
          }
        }
      }
    };
  }

  async welcomeMessage(messageText, senderID) {
        // botmetrics.logUserRequest(messageText, senderID);
    log.debug('Process welcome message', {
      module: 'botstack:welcomeMessage',
      senderId: senderID
    });
    if (BotStackCheck('welcomeMessage')) {
      BotStackEvents.emit('welcomeMessage', {
        senderID,
        messageText
      });
      return;
    }
    try {
      const apiaiResp = await apiai.processEvent('FACEBOOK_WELCOME', senderID);
      log.debug('Facebook welcome result', {
        module: 'botstack:welcomeMessage',
        senderId: senderID
      });
      await fb.processMessagesFromApiAi(apiaiResp, senderID);
            // botmetrics.logServerResponse(apiaiResp, senderID);
    } catch (err) {
      log.error(err, {
        module: 'botstack:welcomeMessage',
        senderId: senderID,
        reason: 'Error in API.AI response'
      });
      await fb.reply(fb.textMessage("I'm sorry, I didn't understand that"), senderID);
            // botmetrics.logServerResponse(err, senderID);
    }
  }

  async postbackMessage(postback, senderID) {
    const text = postback.postback.payload;
    log.debug('Process postback', {
      module: 'botstack:postbackMessage',
      senderId: senderID,
      postback,
      text
    });
        // botmetrics.logUserRequest(text, senderID);
    if (BotStackCheck('postbackMessage')) {
      BotStackEvents.emit('postbackMessage', {
        senderID,
        postback
      });
      return;
    }
    log.debug('Sending to API.AI', {
      module: 'botstack:postbackMessage',
      senderId: senderID,
      text
    });
    try {
      const apiaiResp = await apiai.processTextMessage(text, senderID);
      await fb.processMessagesFromApiAi(apiaiResp, senderID);
            // botmetrics.logServerResponse(apiaiResp, senderID);
    } catch (err) {
      log.error(err, {
        module: 'botstack:postbackMessage',
        senderId: senderID,
        reason: 'Error in API.AI response'
      });
      await fb.reply(fb.textMessage("I'm sorry, I didn't understand that"), senderID);
            // botmetrics.logServerResponse(err, senderID);
    }
  }

  async quickReplyPayload(message, senderID) {
    const text = lodash.get(message, 'message.quick_reply.payload');
    log.debug('Process quick reply payload', {
      module: 'botstack: quickReplyPayload',
      senderId: senderID,
      text
    });
        // botmetrics.logUserRequest(text, senderID);
    if (BotStackCheck('quickReplyPayload')) {
      BotStackEvents.emit('quickReplyPayload', {
        senderID,
        text,
        message
      });
      return;
    }
    log.debug('Sending to API.AI', {
      module: 'botstack:quickReplyPayload',
      senderId: senderID,
      text
    });
    try {
      const apiaiResp = await apiai.processTextMessage(text, senderID);
      await fb.processMessagesFromApiAi(apiaiResp, senderID);
            // botmetrics.logServerResponse(apiaiResp, senderID);
    } catch (err) {
      log.error(err, {
        module: 'botstack:quickReplyPayload',
        senderId: senderID,
        reason: 'Error in API.AI response'
      });
      await fb.reply(fb.textMessage("I'm sorry, I didn't understand that"), senderID);
            // botmetrics.logServerResponse(err, senderID);
    }
  }

  async fallback(message, senderID) {
    log.debug('Unknown message', {
      module: 'botstack:fallback',
      senderId: senderID,
      message
    });
  }

  startServer() {
    const port = process.env.PORT || 1337;
    this.server.listen(port, () => {
      console.log(`Bot '${this.botName}' is ready`);
      console.log('listening on port:%s %s %s', port, this.server.name, this.server.url);
    });
  }
}

module.exports = BotStack;
