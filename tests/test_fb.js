const lodash = require('lodash');
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

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

describe('Testing FB', () => {
  it('Testing text response (type = 0)', async () => {
    const apiAiTextResponse = require('../fixtures/apiai/text_response.json');
    const data = [];

    const apiai = require('../src/api-ai');
    const apiAiResult = apiai.processResponse(apiAiTextResponse, '1234567890');

    rewiremock('./reply').callThought().with({
      reply: async (message, senderId) => {
        data.push(message);
        return true;
      }
    });

    rewiremock.enable();
    rewiremock.isolation();

    const fb = require(rewiremock.resolve('../src/fb'));

    const senderID = '1234567890';
    const res = await fb.processMessagesFromApiAi(apiAiResult, senderID);

    rewiremock.disable();
    rewiremock.clear();

    assert.equal(lodash.get(lodash.find(data, 'text'), 'text'), 'Hello turbo!');
    assert.equal(res.length, 0);
  });

  it('Testing text response (type = 0) with dontSend=true', async () => {
    const apiAiTextResponse = require('../fixtures/apiai/text_response.json');
    const data = [];

    const apiai = require('../src/api-ai');
    const apiAiResult = apiai.processResponse(apiAiTextResponse, '1234567890');

    rewiremock('./reply').callThought().with({
      reply: async (message, senderId) => {
        data.push(message);
        return true;
      }
    });

    rewiremock.enable();
    rewiremock.isolation();

    const fb = require(rewiremock.resolve('../src/fb'));

    const senderID = '1234567890';
    const res = await fb.processMessagesFromApiAi(apiAiResult, senderID, true);

    rewiremock.disable();
    rewiremock.clear();

    assert.equal(lodash.get(lodash.find(res, 'text'), 'text'), 'Hello turbo!');
    assert.equal(res.length, 1);
    assert.equal(data.length, 0);
  });

  it('Testing structured message (type = 1) with postback', async () => {
    const apiAiTextResponse = require('../fixtures/apiai/card_response.json');
    const data = [];

    const apiai = require('../src/api-ai');
    const apiAiResult = apiai.processResponse(apiAiTextResponse, '1234567890');

    rewiremock('./reply').callThought().with({
      reply: async (message, senderId) => {
        data.push(message);
        return true;
      }
    });

    rewiremock.enable();
    rewiremock.isolation();

    const fb = require(rewiremock.resolve('../src/fb'));

    const senderID = '1234567890';
    const res = await fb.processMessagesFromApiAi(apiAiResult, senderID);

    rewiremock.disable();
    rewiremock.clear();

    assert.isOk(lodash.find(data, 'attachment'));
    assert.equal(lodash.get(data, '[0].attachment.payload.elements[0].title'), 'Super Card Title');
    assert.equal(lodash.get(data, '[0].attachment.payload.elements[0].subtitle'), 'Super Card Subtitle');
    assert.equal(lodash.get(data, '[0].attachment.payload.elements[0].image_url'), 'http://example.com/image.jpg');
    assert.equal(lodash.get(data, '[0].attachment.payload.elements[0].buttons', []).length, 3);
    assert.equal(lodash.get(data, '[0].attachment.payload.elements[0].buttons[0].type'), 'postback');
    assert.equal(lodash.get(data, '[0].attachment.payload.elements[0].buttons[0].title'), 'Button 1');
    assert.equal(lodash.get(data, '[0].attachment.payload.elements[0].buttons[0].payload'), 'Postback 1');
  });

  it('Testing structured message (type = 1) with postback as image url', async () => {
    const apiAiTextResponse = require('../fixtures/apiai/card_postback_image_response.json');
    const data = [];

    const apiai = require('../src/api-ai');
    const apiAiResult = apiai.processResponse(apiAiTextResponse, '1234567890');

    rewiremock('./reply').callThought().with({
      reply: async (message, senderId) => {
        data.push(message);
        return true;
      }
    });

    rewiremock.enable();
    rewiremock.isolation();

    const fb = require(rewiremock.resolve('../src/fb'));

    const senderID = '1234567890';
    const res = await fb.processMessagesFromApiAi(apiAiResult, senderID);

    rewiremock.disable();
    rewiremock.clear();

    assert.isOk(lodash.find(data, 'attachment'));

    assert.equal(lodash.get(data, '[0].attachment.payload.elements[0].title'), 'Super Card Title');
    assert.equal(lodash.get(data, '[0].attachment.payload.elements[0].subtitle'), 'Super Card Subtitle');
    assert.equal(lodash.get(data, '[0].attachment.payload.elements[0].image_url'), 'http://example.com/image.jpg');
    assert.equal(lodash.get(data, '[0].attachment.payload.elements[0].buttons', []).length, 3);
    assert.equal(lodash.get(data, '[0].attachment.payload.elements[0].buttons[0].type'), 'web_url');
    assert.equal(lodash.get(data, '[0].attachment.payload.elements[0].buttons[0].title'), 'Button 1');
    assert.equal(lodash.get(data, '[0].attachment.payload.elements[0].buttons[0].url'), 'http://example.com/button.jpg');
  });

  it('Testing quick replies message (type = 2)', async () => {
    const apiAiTextResponse = require('../fixtures/apiai/quick_replies_response.json');
    const data = [];

    const apiai = require('../src/api-ai');
    const apiAiResult = apiai.processResponse(apiAiTextResponse, '1234567890');

    rewiremock('./reply').callThought().with({
      reply: async (message, senderId) => {
        data.push(message);
        return true;
      }
    });

    rewiremock.enable();
    rewiremock.isolation();

    const fb = require(rewiremock.resolve('../src/fb'));

    const senderID = '1234567890';
    const res = await fb.processMessagesFromApiAi(apiAiResult, senderID);

    rewiremock.disable();
    rewiremock.clear();

    assert.isOk(lodash.find(data, 'quick_replies'));
    assert.equal(lodash.get(data, '[0].text'), 'Choose');
    assert.equal(lodash.get(data, '[0].quick_replies', []).length, 3);
    assert.equal(lodash.get(data, '[0].quick_replies[0].content_type'), 'text');
    assert.equal(lodash.get(data, '[0].quick_replies[0].title'), 'Value 1');
    assert.equal(lodash.get(data, '[0].quick_replies[0].payload'), 'Value 1');
  });

  it('Testing image message (type = 3)', async () => {
    const apiAiTextResponse = require('../fixtures/apiai/image_response.json');
    const data = [];

    const apiai = require('../src/api-ai');
    const apiAiResult = apiai.processResponse(apiAiTextResponse, '1234567890');

    rewiremock('./reply').callThought().with({
      reply: async (message, senderId) => {
        data.push(message);
        return true;
      }
    });

    rewiremock.enable();
    rewiremock.isolation();

    const fb = require(rewiremock.resolve('../src/fb'));

    const senderID = '1234567890';
    const res = await fb.processMessagesFromApiAi(apiAiResult, senderID);

    rewiremock.disable();
    rewiremock.clear();

    assert.isOk(lodash.find(data, 'attachment'));
    assert.equal(lodash.get(data, '[0].attachment.type'), 'image');
    assert.equal(lodash.get(data, '[0].attachment.payload.url'), 'http://example.com/image.jpg');
  });

  it('Testing custom payload message (type = 4)', async () => {
    const apiAiTextResponse = require('../fixtures/apiai/custom_payload_image_response.json');
    const data = [];

    const apiai = require('../src/api-ai');
    const apiAiResult = apiai.processResponse(apiAiTextResponse, '1234567890');

    rewiremock('./reply').callThought().with({
      reply: async (message, senderId) => {
        data.push(message);
        return true;
      }
    });

    rewiremock.enable();
    rewiremock.isolation();

    const fb = require(rewiremock.resolve('../src/fb'));

    const senderID = '1234567890';
    const res = await fb.processMessagesFromApiAi(apiAiResult, senderID);

    rewiremock.disable();
    rewiremock.clear();

    assert.isOk(lodash.find(data, 'attachment'));
    assert.equal(lodash.get(data, '[0].attachment.type'), 'image');
    assert.equal(lodash.get(data, '[0].attachment.payload.url'), 'http://example.com/image.jpg');
  });

  it('Testing with empty response', async () => {
    const apiAiTextResponse = require('../fixtures/apiai/test_response_empty.json');
    const data = [];

    const apiai = require('../src/api-ai');
    const apiAiResult = apiai.processResponse(apiAiTextResponse, '1234567890');

    rewiremock('./reply').callThought().with({
      reply: async (message, senderId) => {
        data.push(message);
        return true;
      }
    });

    rewiremock.enable();
    rewiremock.isolation();

    const fb = require(rewiremock.resolve('../src/fb'));

    const senderID = '1234567890';
    const res = await fb.processMessagesFromApiAi(apiAiResult, senderID);

    rewiremock.disable();
    rewiremock.clear();

    assert.equal(lodash.get(apiAiResult, 'messages').length, 0);
    assert.equal(!lodash.isEmpty(lodash.get(apiAiResult, 'response.result.action')), true);
  });
});
