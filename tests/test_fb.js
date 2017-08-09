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

describe('Testing FB', () => {

  it('Testing text response (type = 0)', async () => {
    const apiAiTextResponse = require('../fixtures/apiai/text_response.json');
    const data = [];

    let apiai = require('../src/api-ai');
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

  it('Testing structured message (type = 1) with postback', async () => {
    const apiAiTextResponse = require('../fixtures/apiai/card_response.json');
    const data = [];

    let apiai = require('../src/api-ai');
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

    let apiai = require('../src/api-ai');
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
    console.log(JSON.stringify(data, null, 2));

    assert.equal(lodash.get(data, '[0].attachment.payload.elements[0].title'), 'Super Card Title');
    assert.equal(lodash.get(data, '[0].attachment.payload.elements[0].subtitle'), 'Super Card Subtitle');
    assert.equal(lodash.get(data, '[0].attachment.payload.elements[0].image_url'), 'http://example.com/image.jpg');
    assert.equal(lodash.get(data, '[0].attachment.payload.elements[0].buttons', []).length, 3);
    assert.equal(lodash.get(data, '[0].attachment.payload.elements[0].buttons[0].type'), 'web_url');
    assert.equal(lodash.get(data, '[0].attachment.payload.elements[0].buttons[0].title'), 'Button 1');
    assert.equal(lodash.get(data, '[0].attachment.payload.elements[0].buttons[0].payload'), 'http://example.com/button.jpg');

  });
});
