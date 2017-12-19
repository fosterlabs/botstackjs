const _ = require('lodash');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const assert = chai.assert;
const expect = chai.expect;

const rewire = require('rewire');
const rewiremock = require('rewiremock').default;
const { addPlugin, plugins } = require('rewiremock');

addPlugin(plugins.relative);
addPlugin(plugins.usedByDefault);

describe('Testing multiconf', () => {

  it('All required variables exists', async () => {
    let envs = rewire('../src/environments.js');
    envs.__set__("process.env", {
      FB_PAGE_ACCESS_TOKEN: "123",
      FB_VERIFY_TOKEN: "123",
      DIALOGFLOW_ACCESS_TOKEN: "123"
    });
    let error = null;
    try {
      await envs.checkEnvironmentVariables(null);
    } catch (err) {
      error = err;
    }
    assert.isNull(error);
  });

  it('Some of enabled modules not configured correctly', async () => {
    let envs = rewire('../src/environments.js');
    envs.__set__("process.env", {
      FB_PAGE_ACCESS_TOKEN: "123",
      FB_VERIFY_TOKEN: "123",
      DIALOGFLOW_ACCESS_TOKEN: "123",
      SMOOCH_SCOPE: "123"
    });
    let error = null;
    try {
      await envs.checkEnvironmentVariables(null);
    } catch (err) {
      error = err;
    }
    assert.isNotNull(error);
  });

  it('Some of required variables not configured correctly', async () => {
    let envs = rewire('../src/environments.js');
    envs.__set__("process.env", {
      FB_PAGE_ACCESS_TOKEN: "123",
      DIALOGFLOW_ACCESS_TOKEN: "123",
      SMOOCH_SCOPE: "123"
    });
    let error = null;
    try {
      await envs.checkEnvironmentVariables(null);
    } catch (err) {
      error = err;
    }
    assert.isNotNull(error);
  });
});
