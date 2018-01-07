const _ = require('lodash');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const assert = chai.assert;
const expect = chai.expect;

const rewire = require('rewire');

const messageBuilder = require('./utils/message_builder');
const fbReqBuilder = require('./utils/fb_req_builder');

describe('Testing work with multieplie facebook tokens', () => {

  it('Testing init function', async () => {
    const BotStack = require('../index.js');
    async function init() {
      const ddd = new BotStack();
      await ddd.init();
    }
    await expect(init()).to.be.rejected;
  });

  it('Testing single message with pageId', async () => {

    let returnData = null;

    let BotStack = rewire('../src/botstack.js');
    let fb = rewire('../src/fb/index.js');
    let reply = rewire('../src/fb/reply.js');

    reply.__set__('rp', async (data) => {
      returnData = data;
      return {
        statusCode: 200,
        body: ''
      };
    });
    fb.__set__('replyInstance', reply);
    BotStack.__set__('fbInstance', fb);

    class Bot extends BotStack {

      async customGetEnv(envName, params={}) {
        if (envName == 'FB_PAGE_ACCESS_TOKEN') {
          const pageId = _.get(params, 'pageId', 0);
          if (pageId == '1') {
            return '10';
          } else if (pageId == '2') {
            return '20';
          } else if (pageId == '3') {
            return '30';
          } else {
            return '55';
          }
        } else {
          return null;
        }
      };

      async textMessage(message, senderId, pageId) {
        await this.fb.reply(this.fb.textMessage('Hello'), senderId, { pageId });
      }
    }

    _.set(process.env, 'FB_VERIFY_TOKEN', '2');
    _.set(process.env, 'DIALOGFLOW_ACCESS_TOKEN', '3');
    const botStack = new Bot();
    // mock
    botStack._syncFbMessageToBackChat = async (req) => {};
    //
    await botStack.init();
    let webhook = botStack._webhookPost(botStack);
    //
    let message = messageBuilder.buildTextMessage({ sender_id: '1', text: 'hello' });
    let req = fbReqBuilder.buildFbRequest({ page_id: '2', messaging: [ message ] });
    let res = fbReqBuilder.buildFbResponse();
    let next = {};
    //
    await webhook(req, res, next);
    assert.isTrue(_.has(returnData, 'qs.access_token'));
    assert.equal(_.get(returnData, 'qs.access_token'), '20');
  });

  it('Testing set of messages with different pageIds', async () => {
    let returnData = [];

    let BotStack = rewire('../src/botstack.js');
    let fb = rewire('../src/fb/index.js');
    let reply = rewire('../src/fb/reply.js');

    reply.__set__('rp', async (data) => {
      returnData.push(data);
      return {
        statusCode: 200,
        body: ''
      };
    });
    fb.__set__('replyInstance', reply);
    BotStack.__set__('fbInstance', fb);

    class Bot extends BotStack {

      async customGetEnv(envName, params={}) {
        if (envName == 'FB_PAGE_ACCESS_TOKEN') {
          const pageId = _.get(params, 'pageId', 0);
          if (pageId == '1') {
            return '10';
          } else if (pageId == '2') {
            return '20';
          } else if (pageId == '3') {
            return '30';
          } else {
            return '55';
          }
        } else {
          return null;
        }
      };

      async textMessage(message, senderId, pageId) {
        await this.fb.reply(this.fb.textMessage('Hello'), senderId, { pageId });
      }
    }

    _.set(process.env, 'FB_VERIFY_TOKEN', '2');
    _.set(process.env, 'DIALOGFLOW_ACCESS_TOKEN', '3');
    const botStack = new Bot();
    // mock
    botStack._syncFbMessageToBackChat = async (req) => {};
    //
    await botStack.init();
    let webhook = botStack._webhookPost(botStack);
    //
    for (let i = 0; i < 4; i++) {
      let pageId = _.toString(i + 1);
      let message = messageBuilder.buildTextMessage({ sender_id: '1', text: 'hello' });
      let req = fbReqBuilder.buildFbRequest({ page_id: pageId, messaging: [ message ] });
      let res = fbReqBuilder.buildFbResponse();
      let next = {};
      await webhook(req, res, next);
    }
    assert.equal(_.get(returnData, '[0].qs.access_token'), '10');
    assert.equal(_.get(returnData, '[1].qs.access_token'), '20');
    assert.equal(_.get(returnData, '[2].qs.access_token'), '30');
    assert.equal(_.get(returnData, '[3].qs.access_token'), '55');
  });
});
