const lodash = require('lodash');
const sinon = require('sinon');

const rewiremock = require('rewiremock').default;
const { addPlugin, plugins } = require('rewiremock');

addPlugin(plugins.relative);
addPlugin(plugins.usedByDefault);

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const assert = chai.assert;

describe('Testing FB only', () => {
  let oldProcessEnv = null;

  beforeEach(() => {
    oldProcessEnv = lodash.cloneDeep(process.env);
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

    assert.equal(data.length, 2);
  });
});
