const lodash = require('lodash');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const assert = chai.assert;

const rewiremock = require('rewiremock').default;
const { addPlugin, plugins } = require('rewiremock');

addPlugin(plugins.relative);
addPlugin(plugins.usedByDefault);

describe('Testing BotStack class', () => {
  let saveProcessEnv = {};

  beforeEach(() => {
    saveProcessEnv = lodash.cloneDeep(process.env);
    process.env = {};
  });

  afterEach(() => {
    process.env = lodash.cloneDeep(saveProcessEnv);
  });

  it('Class init test', (done) => {
    rewiremock('request-promise').with(async data => ({
      statusCode: 200,
      body: lodash.get(data, 'json')
    }));
    rewiremock('../fixtures/apiai/text_response.json').callThought();
    rewiremock.enable();
    rewiremock.isolation();
    try {
      const BotStack = require('../src/botstack');
      function init() {
        new BotStack();
      }
      assert.throws(init, Error);
      assert.throws(init, 'Not found env variables: FB_PAGE_ACCESS_TOKEN,FB_VERIFY_TOKEN,APIAI_ACCESS_TOKEN');
      done();
    } catch (e) {
      done(e);
    }
    rewiremock.disable();
    rewiremock.clear();
  });

  it('Init test with env vars', (done) => {
    rewiremock('request-promise').with(async data => ({
      statusCode: 200,
      body: lodash.get(data, 'json')
    }));
    rewiremock('../fixtures/apiai/text_response.json').callThought();
    rewiremock.enable();
    rewiremock.isolation();
    try {
      process.env = {
        FB_PAGE_ACCESS_TOKEN: '1234567890',
        FB_VERIFY_TOKEN: '1234567890',
        APIAI_ACCESS_TOKEN: '1234567890'
      };
      const BotStack = require('../src/botstack');
      function init() {
        new BotStack();
      }
      assert.doesNotThrow(init, Error);
      assert.doesNotThrow(init, 'Not found env variables: FB_PAGE_ACCESS_TOKEN,FB_VERIFY_TOKEN,APIAI_ACCESS_TOKEN');
      done();
    } catch (e) {
      done(e);
    }
    rewiremock.disable();
    rewiremock.clear();
  });
});
