const _ = require('lodash');
const restify = require('restify');
const rp = require('request-promise');

const fbInstance = require('./fb');
const dialogflow = require('./dialogflow');
const log = require('./log');
const smooch = require('./smooch');
const environments = require('./environments');
const settings = require('./settings');


process.on('unhandledRejection', (reason, p) => {
  log.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  log.error(`Caught exception: ${err}`);
});


const sessionStore = require('./session')();
const state = require('./state')();
const s3 = require('./s3');
const env = require('./multiconf');

const { BotStackEmitterInit, BotStackCheck, BotStackEvents } = require('./events');

class BotStack {

  constructor(botName = 'default bot', { useSmoochWebhook = false } = {}) {
    this.botName = botName;
    this.server = restify.createServer();
    this.server.use(restify.queryParser());
    this.server.use(restify.bodyParser());
    this.restify = restify;

    // utils
    this.fb = fbInstance(this);
    this.apiai = dialogflow(this); // for backward compatibility
    this.dialogflow = dialogflow(this);
    this.s3 = s3;
    this.log = log;
    this.env = env(this);
  }

  /* eslint-disable class-methods-use-this, no-unused-vars */
  async customGetEnv(envName, params = {}) {
    return null;
  }
  /* eslint-enable class-methods-use-this, no-unused-vars */

  /* eslint-disable no-unused-vars */
  subscription(message) {
    this.log.debug('Subscription method not implemented', {
      module: 'botstack:subscription'
    });
  }
  /* eslint-enable no-unused-vars */

  async geoLocationMessage(message, senderId, pageId) {
    this.log.debug('Process GEO location message', {
      module: 'botstack:geoLocationMessage',
      senderId,
      message,
      pageId
    });
    if (BotStackCheck('geoLocationMessage')) {
      BotStackEvents.emit('geoLocationMessage', {
        senderId,
        message,
        pageId
      });
    }
  }

  async textMessage(message, senderId, pageId, dontUseEvents = false) {
    const text = message.message.text;
    // botmetrics.logUserRequest(text, senderID);
    this.log.debug('Process text message', {
      module: 'botstack:textMessage',
      senderId,
      message
    });
    if (!dontUseEvents) {
      if (BotStackCheck('textMessage')) {
        BotStackEvents.emit('textMessage', {
          senderId,
          message,
          pageId
        });
        return;
      }
    }
    this.log.debug('Sending to API.AI', {
      module: 'botstack:textMessage',
      senderId,
      text
    });
    try {
      const dialogflowResp = await this.dialogflow.processTextMessage(text, senderId, pageId);
      await this.fb.processMessagesFromDialogflow(dialogflowResp, senderId, pageId);
            // botmetrics.logServerResponse(apiaiResp, senderID);
    } catch (err) {
      await this.fb.reply(
        this.fb.textMessage("I'm sorry, I didn't understand that"),
        senderId, { pageId });
      this.log.error(err, {
        module: 'botstack:textMessage',
        senderId,
        pageId,
        reason: 'Error on Dialogflow request'
      });
            // botmetrics.logServerResponse(err, senderID);
    }
  }

  _smoochWebhook(context) {
    this.log.debug('Smooch API endpoint ready', {
      module: 'botstack:smoochWebhook'
    });
    const self = context;
    return async function (req, res, next) { // eslint-disable-line func-names, no-unused-vars
      res.end();
      /* eslint-disable no-restricted-syntax, no-continue, no-await-in-loop */
      for (const msg of _.get(req.body, 'messages', [])) {
        // message schema
        // https://docs.smooch.io/rest/?javascript#schema44
        if (msg.role !== 'appUser') {
          continue;
        }
        self.log.debug('New message from Smooch endpoint', {
          module: 'botstack:smoochWebhook',
          message: msg
        });
        const text = _.get(msg, 'text');
        const authorId = _.get(msg, 'authorId');
        let dialogflowResponse = null;
        let result = null;
        const pageId = ''; // TODO: check ?
        try {
          dialogflowResponse = await self.dialogflow.processTextMessage(text, authorId, pageId);
          result = await smooch.processMessagesFromDialogflow(dialogflowResponse, authorId);
          self.log.debug('Smooch API result', {
            module: 'botstack:smoochWebhook',
            result
          });
        } catch (err) {
          self.log.error(err, {
            module: 'botstack:smoochWebhook'
          });
        }
      }
      /* eslint-enable no-restricted-syntax, no-continue */
    };
  }

  async _syncFbMessageToBackChat(req) {
    const BACKCHAT_FB_SYNC_URL = await this.env.getEnv('BACKCHAT_FB_SYNC_URL');
    if (BACKCHAT_FB_SYNC_URL) {
      const reqData = {
        url: BACKCHAT_FB_SYNC_URL,
        resolveWithFullResponse: true,
        method: 'POST',
        json: req.body
      };
      let result = null;
      try {
        result = await rp(reqData);
        if (result.statusCode !== 200) {
          this.log.warn('Something wrong with BackChat endpoint', {
            module: 'botstack'
          });
        } else {
          this.log.debug('Copy FB response to BackChat endpoint', {
            module: 'botstack'
          });
        }
      } catch (err) {
        this.log.error(err, {
          module: 'botstack'
        });
        throw err;
      }
    }
  }

  /* eslint-disable class-methods-use-this, func-names, no-restricted-syntax */
  _webhookPost(context) {
    const self = context;
    return async function (req, res, next) { // eslint-disable-line no-unused-vars
      res.end();
      await self._syncFbMessageToBackChat(req); // eslint-disable-line no-underscore-dangle
      const entries = _.get(req, 'body.entry', []);
      for (const entry of entries) {
        let pageId = null;
        if (_.get(req.body, 'object') === 'page') {
          pageId = _.get(entry, 'id', null);
        }
        const messages = _.get(entry, 'messaging', []);
        for (const message of messages) {
          // The sender object is not included for messaging_optins events triggered by the checkbox plugin.
          // https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_optins
          let isMessagingOptins = false;
          let isMessageRequest = false;
          let recipientUserRef = null;
          // The sender object is not included for messaging_optins events triggered by the checkbox plugin.
          const senderId = _.get(message, 'sender.id');
          if ((!senderId) && (_.has(message, 'optin.user_ref'))) {
            // it's checkbox plugin
            isMessagingOptins = true;
            recipientUserRef = _.get(message, 'optin.user_ref');
          } else if ((senderId) && (
            _.has(message, 'message_request') || _.has(message, 'optin.message_request')
          )) {
            //
            isMessagingOptins = true;
            isMessageRequest = true;
          }
          const isEcho = !!_.get(message, 'message.is_echo');
          if (isEcho) {
            continue; // eslint-disable-line no-continue
          }
          self.log.debug('New Facebook message', {
            module: 'botstack:webhookPost',
            page_id: pageId,
            message
          });
          const isNewSession = await sessionStore.checkExists(senderId);
          const isPostbackMessage = !!message.postback;
          const isQuickReplyPayload = !!_.get(message, 'message.quick_reply.payload');
          const isTextMessage = !!(!isQuickReplyPayload && _.get(message, 'message.text'));
          const isGeoLocationMessage = !!_.get(message, 'message.attachments[0].payload.coordinates');
          self.log.debug('Detect kind of message', {
            module: 'botstack:webhookPost',
            senderId,
            pageId,
            isNewSession,
            isPostbackMessage,
            isQuickReplyPayload,
            isTextMessage,
            isGeoLocationMessage,
            isMessagingOptins
          });
          await sessionStore.set(senderId);
          if (isQuickReplyPayload) {
            await self.quickReplyPayload(message, senderId, pageId);
          } else if (isGeoLocationMessage) {
            await self.geoLocationMessage(message, senderId, pageId);
          } else if (isTextMessage) {
            if (message.message.text === 'Get Started') {
              await self.welcomeMessage(message.message.text, senderId, pageId, message);
            } else {
              await self.textMessage(message, senderId, pageId);
            }
          } else if (isPostbackMessage) {
            if (message.postback.payload === 'Get Started') {
              await self.welcomeMessage(message.postback.payload, senderId, pageId, message);
            } else {
              await self.postbackMessage(message, senderId, pageId);
            }
          } else if (isMessagingOptins && isMessageRequest) {
            await self.messageRequest(message, senderId, pageId);
          } else if (isMessagingOptins) {
            await self.messagingOptins(message, recipientUserRef);
          } else {
            await self.fallback(message, senderId, pageId);
          }
        }
      }
    };
  }
  /* eslint-enable class-methods-use-this, func-names */

  async messageRequest(message, senderId, pageId) {
    this.log.debug('Process message request', {
      module: 'botstack:messageRequest',
      senderId,
      pageId
    });
  }

  async welcomeMessage(messageText, senderId, pageId, message = null) {
    // botmetrics.logUserRequest(messageText, senderID);
    this.log.debug('Process welcome message', {
      module: 'botstack:welcomeMessage',
      senderId,
      pageId
    });
    if (BotStackCheck('welcomeMessage')) {
      BotStackEvents.emit('welcomeMessage', {
        senderId,
        messageText,
        pageId
      });
      return;
    }
    try {
      const dialogflowResp = await this.dialogflow.processEvent('FACEBOOK_WELCOME', senderId, pageId);
      this.log.debug('Facebook welcome result', {
        module: 'botstack:welcomeMessage',
        senderId,
        pageId
      });
      await this.fb.processMessagesFromDialogflow(dialogflowResp, senderId, pageId);
      // botmetrics.logServerResponse(apiaiResp, senderID);
    } catch (err) {
      this.log.error(err, {
        module: 'botstack:welcomeMessage',
        senderId,
        pageId,
        reason: 'Error in Dialogflow response'
      });
      await this.fb.reply(
        this.fb.textMessage("I'm sorry, I didn't understand that"),
        senderId,
        pageId);
      // botmetrics.logServerResponse(err, senderID);
    }
  }

  async postbackMessage(postback, senderId, pageId) {
    const text = postback.postback.payload;
    this.log.debug('Process postback', {
      module: 'botstack:postbackMessage',
      senderId,
      pageId,
      postback,
      text
    });
        // botmetrics.logUserRequest(text, senderID);
    if (BotStackCheck('postbackMessage')) {
      BotStackEvents.emit('postbackMessage', {
        senderId,
        pageId,
        postback
      });
      return;
    }
    this.log.debug('Sending to Dialogflow', {
      module: 'botstack:postbackMessage',
      senderId,
      pageId,
      text
    });
    try {
      const dialogflowResp = await this.dialogflow.processTextMessage(text, senderId, pageId);
      await this.fb.processMessagesFromDialogflow(dialogflowResp, senderId, pageId);
      // botmetrics.logServerResponse(apiaiResp, senderID);
    } catch (err) {
      this.log.error(err, {
        module: 'botstack:postbackMessage',
        senderId,
        pageId,
        reason: 'Error in Dialogflow response'
      });
      await this.fb.reply(
        this.fb.textMessage("I'm sorry, I didn't understand that"),
        senderId,
        pageId);
      // botmetrics.logServerResponse(err, senderID);
    }
  }

  async quickReplyPayload(message, senderId, pageId) {
    const text = _.get(message, 'message.quick_reply.payload');
    this.log.debug('Process quick reply payload', {
      module: 'botstack: quickReplyPayload',
      senderId,
      pageId,
      text
    });
        // botmetrics.logUserRequest(text, senderID);
    if (BotStackCheck('quickReplyPayload')) {
      BotStackEvents.emit('quickReplyPayload', {
        senderId,
        pageId,
        text,
        message
      });
      return;
    }
    this.log.debug('Sending to Dialogflow', {
      module: 'botstack:quickReplyPayload',
      senderId,
      pageId,
      text
    });
    try {
      const dialogflowResp = await this.dialogflow.processTextMessage(text, senderId, pageId);
      await this.fb.processMessagesFromDialogflow(dialogflowResp, senderId, pageId);
      // botmetrics.logServerResponse(apiaiResp, senderID);
    } catch (err) {
      this.log.error(err, {
        module: 'botstack:quickReplyPayload',
        senderId,
        pageId,
        reason: 'Error in Dialogflow response'
      });
      await this.fb.reply(
        this.fb.textMessage("I'm sorry, I didn't understand that"),
        senderId,
        pageId);
      // botmetrics.logServerResponse(err, senderID);
    }
  }

  async fallback(message, senderId, pageId) {
    this.log.debug('Unknown message', {
      module: 'botstack:fallback',
      senderId,
      pageId,
      message
    });
  }

  async messagingOptins(message, recipientUserRef) {
    // on first request we have:
    // {
    //  "recipient":{
    //    "id":"<PAGE_ID>"
    //   },
    //   "timestamp":<UNIX_TIMESTAMP>,
    //   "optin":{
    //     "ref":"<PASS_THROUGH_PARAM>",
    //     "user_ref":"<UNIQUE_REF_PARAM>"
    //   }
    // }

    // next send message to user using user_ref param
    // curl -X POST -H "Content-Type: application/json" -d '{
    // "recipient": {
    //   "user_ref":"<UNIQUE_REF_PARAM>"
    //  },
    // "message": {
    //  "text":"hello, world!"
    // }
    // }' "https://graph.facebook.com/v2.6/me/messages?access_token=<PAGE_ACCESS_TOKEN>"

    // after got result:
    // {
    //  "message_id": "mid.1456970487936:c34767dfe57ee6e339"
    // }

    // let's save this user_ref for future use...
    //
    this.log.debug('Process message opt-in payload', {
      module: 'botstack:messagingOptins',
      recipientUserRef
    });
    if (BotStackCheck('messagingOptins')) {
      BotStackEvents.emit('messagingOptins', {
        recipientUserRef,
        message
      });
      return;
    }
    this.log.debug('Sending to Dialogflow', {
      module: 'botstack:messagingOptins',
      recipientUserRef,
      message
    });
    await this.fb.reply(
      this.fb.textMessage('Hello!'),
      recipientUserRef, { params: { use_user_ref: true } });
  }

  async init() {
    settings.parseConfig(this); // don't wait to complete with `async`
    await environments.checkEnvironmentVariables(this);
    await environments.processEnvironmentVariables(this);

    this.events = BotStackEmitterInit;
    this.state = state;

    this.server.get('/', (req, res, next) => {
      res.send('Nothing to see here...');
      return next();
    });

    this.server.get('/webhook/', async (req, res, next) => {
      const token = req.query.hub.verify_token;
      const FB_VERIFY_TOKEN = await this.env.getEnv('FB_VERIFY_TOKEN');
      if (token === FB_VERIFY_TOKEN) {
        res.write(req.query.hub.challenge);
        res.end();
      } else {
        res.send('Error, wrong validation token');
      }
      return next();
    });

    this.server.post('/webhook/', this._webhookPost(this)); // eslint-disable-line no-underscore-dangle
    this.server.post('/smooch/webhook/', this._smoochWebhook(this)); // eslint-disable-line no-underscore-dangle
  }

  startServer() {
    const port = process.env.PORT || 1337;
    const self = this;
    this.server.listen(port, () => {
      self.log.info(`Bot '${self.botName}' is ready`, {
        module: 'botstack'
      });
      self.log.info(`listening on port:${port} ${self.server.name} ${self.server.url}`, {
        module: 'botstack'
      });
    });
  }

}

module.exports = BotStack;
