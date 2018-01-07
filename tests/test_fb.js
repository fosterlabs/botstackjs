const _ = require('lodash');
const rewiremock = require('rewiremock').default;
const { addPlugin, plugins } = require('rewiremock');

addPlugin(plugins.relative);
addPlugin(plugins.usedByDefault);

// rewiremock.passBy(/node_modules/);

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const assert = chai.assert;
const expect = chai.expect;

let botstackFakeInstance = {};
_.set(botstackFakeInstance, 'log.debug', () => {});

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

describe('Testing FB', () => {
  it('Testing text response (type = 0)', async () => {
    const apiAiTextResponse = require('../fixtures/apiai/text_response.json');
    const data = [];

    const dialogflowInstance = require('../src/dialogflow');
    const dialogflow = dialogflowInstance(botstackFakeInstance);
    const apiAiResult = dialogflow.processResponse(apiAiTextResponse, '1234567890');

    rewiremock('./reply').with((botstackInstance) => {
      return {
        reply: async (message, senderId, {
          messagingType = 'RESPONSE',
          params = null,
          pageId = null } = {}) => {
            data.push(message);
            return true;
          }
      };
    });

    rewiremock.enable();

    const fbInstance = require(rewiremock.resolve('../src/fb'));
    const fb = fbInstance(botstackFakeInstance);

    const senderID = '1234567890';
    const pageID = '0';
    const res = await fb.processMessagesFromApiAi(apiAiResult, senderID, pageID);

    rewiremock.disable();
    rewiremock.clear();

    assert.equal(_.get(_.find(data, 'text'), 'text'), 'Hello turbo!');
    assert.equal(res.length, 0);
  });

  it('Testing text response (type = 0) with dontSend=true', async () => {
    const apiAiTextResponse = require('../fixtures/apiai/text_response.json');
    const data = [];

    const dialogflowInstance = require('../src/dialogflow');
    const dialogflow = dialogflowInstance(botstackFakeInstance);
    const apiAiResult = dialogflow.processResponse(apiAiTextResponse, '1234567890');

    rewiremock('./reply').with((botstackInstance) => {
      return {
        reply: async (message, senderId, {
          messagingType = 'RESPONSE',
          params = null,
          pageId = null } = {}) => {
            data.push(message);
            return true;
          }
      };
    });

    rewiremock.enable();

    const fbInstance = require(rewiremock.resolve('../src/fb'));
    const fb = fbInstance(botstackFakeInstance);
    const senderID = '1234567890';
    const pageID = '0';
    const res = await fb.processMessagesFromApiAi(apiAiResult, senderID, pageID, true);

    rewiremock.disable();
    rewiremock.clear();

    assert.equal(_.get(_.find(res, 'text'), 'text'), 'Hello turbo!');
    assert.equal(res.length, 1);
    assert.equal(data.length, 0);
  });

  it('Testing structured message (type = 1) with postback', async () => {
    const apiAiTextResponse = require('../fixtures/apiai/card_response.json');
    const data = [];

    const dialogflowInstance = require('../src/dialogflow');
    const dialogflow = dialogflowInstance(botstackFakeInstance);
    const apiAiResult = dialogflow.processResponse(apiAiTextResponse, '1234567890');

    rewiremock('./reply').with((botstackInstance) => {
      return {
        reply: async (message, senderId, {
          messagingType = 'RESPONSE',
          params = null,
          pageId = null } = {}) => {
            data.push(message);
            return true;
          }
      };
    });

    rewiremock.enable();

    const fbInstance = require(rewiremock.resolve('../src/fb'));
    const fb = fbInstance(botstackFakeInstance);

    const senderID = '1234567890';
    const pageID = '0';
    const res = await fb.processMessagesFromApiAi(apiAiResult, senderID, pageID);

    rewiremock.disable();
    rewiremock.clear();

    assert.isOk(_.find(data, 'attachment'));
    assert.equal(_.get(data, '[0].attachment.payload.elements[0].title'), 'Super Card Title');
    assert.equal(_.get(data, '[0].attachment.payload.elements[0].subtitle'), 'Super Card Subtitle');
    assert.equal(_.get(data, '[0].attachment.payload.elements[0].image_url'), 'http://example.com/image.jpg');
    assert.equal(_.get(data, '[0].attachment.payload.elements[0].buttons', []).length, 3);
    assert.equal(_.get(data, '[0].attachment.payload.elements[0].buttons[0].type'), 'postback');
    assert.equal(_.get(data, '[0].attachment.payload.elements[0].buttons[0].title'), 'Button 1');
    assert.equal(_.get(data, '[0].attachment.payload.elements[0].buttons[0].payload'), 'Postback 1');
  });

  it('Testing structured message (type = 1) with postback as image url', async () => {
    const apiAiTextResponse = require('../fixtures/apiai/card_postback_image_response.json');
    const data = [];

    const dialogflowInstance = require('../src/dialogflow');
    const dialogflow = dialogflowInstance(botstackFakeInstance);
    const apiAiResult = dialogflow.processResponse(apiAiTextResponse, '1234567890');

    rewiremock('./reply').with((botstackInstance) => {
      return {
        reply: async (message, senderId, {
          messagingType = 'RESPONSE',
          params = null,
          pageId = null } = {}) => {
            data.push(message);
            return true;
          }
      };
    });

    rewiremock.enable();

    const fbInstance = require(rewiremock.resolve('../src/fb'));
    const fb = fbInstance(botstackFakeInstance);

    const senderID = '1234567890';
    const pageID = '0';
    const res = await fb.processMessagesFromApiAi(apiAiResult, senderID, pageID);

    rewiremock.disable();
    rewiremock.clear();

    assert.isOk(_.find(data, 'attachment'));

    assert.equal(_.get(data, '[0].attachment.payload.elements[0].title'), 'Super Card Title');
    assert.equal(_.get(data, '[0].attachment.payload.elements[0].subtitle'), 'Super Card Subtitle');
    assert.equal(_.get(data, '[0].attachment.payload.elements[0].image_url'), 'http://example.com/image.jpg');
    assert.equal(_.get(data, '[0].attachment.payload.elements[0].buttons', []).length, 3);
    assert.equal(_.get(data, '[0].attachment.payload.elements[0].buttons[0].type'), 'web_url');
    assert.equal(_.get(data, '[0].attachment.payload.elements[0].buttons[0].title'), 'Button 1');
    assert.equal(_.get(data, '[0].attachment.payload.elements[0].buttons[0].url'), 'http://example.com/button.jpg');
  });

  it('Testing quick replies message (type = 2)', async () => {
    const apiAiTextResponse = require('../fixtures/apiai/quick_replies_response.json');
    const data = [];

    const dialogflowInstance = require('../src/dialogflow');
    const dialogflow = dialogflowInstance(botstackFakeInstance);
    const apiAiResult = dialogflow.processResponse(apiAiTextResponse, '1234567890');

    rewiremock('./reply').with((botstackInstance) => {
      return {
        reply: async (message, senderId, {
          messagingType = 'RESPONSE',
          params = null,
          pageId = null } = {}) => {
            data.push(message);
            return true;
          }
      };
    });

    rewiremock.enable();

    const fbInstance = require(rewiremock.resolve('../src/fb'));
    const fb = fbInstance(botstackFakeInstance);

    const senderID = '1234567890';
    const pageID = '0';
    const res = await fb.processMessagesFromApiAi(apiAiResult, senderID, pageID);

    rewiremock.disable();
    rewiremock.clear();

    assert.isOk(_.find(data, 'quick_replies'));
    assert.equal(_.get(data, '[0].text'), 'Choose');
    assert.equal(_.get(data, '[0].quick_replies', []).length, 3);
    assert.equal(_.get(data, '[0].quick_replies[0].content_type'), 'text');
    assert.equal(_.get(data, '[0].quick_replies[0].title'), 'Value 1');
    assert.equal(_.get(data, '[0].quick_replies[0].payload'), 'Value 1');
  });

  it('Testing image message (type = 3)', async () => {
    const apiAiTextResponse = require('../fixtures/apiai/image_response.json');
    const data = [];

    const dialogflowInstance = require('../src/dialogflow');
    const dialogflow = dialogflowInstance(botstackFakeInstance);
    const apiAiResult = dialogflow.processResponse(apiAiTextResponse, '1234567890');

    rewiremock('./reply').with((botstackInstance) => {
      return {
        reply: async (message, senderId, {
          messagingType = 'RESPONSE',
          params = null,
          pageId = null } = {}) => {
            data.push(message);
            return true;
          }
      };
    });

    rewiremock.enable();

    const fbInstance = require(rewiremock.resolve('../src/fb'));
    const fb = fbInstance(botstackFakeInstance);

    const senderID = '1234567890';
    const pageID = '0';
    const res = await fb.processMessagesFromApiAi(apiAiResult, senderID, pageID);

    rewiremock.disable();
    rewiremock.clear();

    assert.isOk(_.find(data, 'attachment'));
    assert.equal(_.get(data, '[0].attachment.type'), 'image');
    assert.equal(_.get(data, '[0].attachment.payload.url'), 'http://example.com/image.jpg');
  });

  it('Testing custom payload message (type = 4)', async () => {
    const apiAiTextResponse = require('../fixtures/apiai/custom_payload_image_response.json');
    const data = [];

    const dialogflowInstance = require('../src/dialogflow');
    const dialogflow = dialogflowInstance(botstackFakeInstance);
    const apiAiResult = dialogflow.processResponse(apiAiTextResponse, '1234567890');

    rewiremock('./reply').with((botstackInstance) => {
      return {
        reply: async (message, senderId, {
          messagingType = 'RESPONSE',
          params = null,
          pageId = null } = {}) => {
            data.push(message);
            return true;
          }
      };
    });

    rewiremock.enable();

    const fbInstance = require(rewiremock.resolve('../src/fb'));
    const fb = fbInstance(botstackFakeInstance);

    const senderID = '1234567890';
    const pageID = '0';
    const res = await fb.processMessagesFromApiAi(apiAiResult, senderID, pageID);

    rewiremock.disable();
    rewiremock.clear();

    assert.isOk(_.find(data, 'attachment'));
    assert.equal(_.get(data, '[0].attachment.type'), 'image');
    assert.equal(_.get(data, '[0].attachment.payload.url'), 'http://example.com/image.jpg');
  });

  it('Testing with empty response', async () => {
    const apiAiTextResponse = require('../fixtures/apiai/test_response_empty.json');
    const data = [];

    const dialogflowInstance = require('../src/dialogflow');
    const dialogflow = dialogflowInstance(botstackFakeInstance);
    const apiAiResult = dialogflow.processResponse(apiAiTextResponse, '1234567890');

    rewiremock('./reply').with((botstackInstance) => {
      return {
        reply: async (message, senderId, {
          messagingType = 'RESPONSE',
          params = null,
          pageId = null } = {}) => {
            data.push(message);
            return true;
          }
      };
    });

    rewiremock.enable();

    const fbInstance = require(rewiremock.resolve('../src/fb'));
    const fb = fbInstance(botstackFakeInstance);

    const senderID = '1234567890';
    const pageID = '0';
    const res = await fb.processMessagesFromApiAi(apiAiResult, senderID, pageID);

    rewiremock.disable();
    rewiremock.clear();

    assert.equal(_.get(apiAiResult, 'messages').length, 0);
    assert.equal(!_.isEmpty(_.get(apiAiResult, 'response.result.action')), true);
  });
});
