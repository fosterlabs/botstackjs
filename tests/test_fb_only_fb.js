const _ = require('lodash');
const sinon = require('sinon');

const rewiremock = require('rewiremock').default;
const { addPlugin, plugins } = require('rewiremock');

addPlugin(plugins.relative);
addPlugin(plugins.usedByDefault);

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const assert = chai.assert;

let botstackFakeInstance = {};
_.set(botstackFakeInstance, 'log.debug', () => {});

describe('Testing FB only', () => {
  let oldProcessEnv = null;

  beforeEach(() => {
    oldProcessEnv = _.cloneDeep(process.env);
    process.env.BOTSTACK_ONLY_FB_RESP = true;
  });

  afterEach(() => {
    if (oldProcessEnv) {
      process.env = oldProcessEnv;
    }
  });

  it('testing fb only', async () => {
    const apiAiTextResponse = require('../fixtures/apiai/two_types_response.json');
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

    assert.equal(data.length, 2);
  });
});
