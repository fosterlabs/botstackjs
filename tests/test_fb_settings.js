const _ = require('lodash');
const rewiremock = require('rewiremock').default;
const { addPlugin, plugins } = require('rewiremock');

addPlugin(plugins.relative);
addPlugin(plugins.usedByDefault);

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const assert = chai.assert;

describe('Testing FB settings', () => {
  it('testing setThreadSettings', async () => {
    let rpData = null;

    rewiremock('request-promise').with(async (data) => {
      rpData = data;
      return { statusCode: 200 };
    });

    rewiremock.enable();

    const fbSetInstance = require(rewiremock.resolve('../src/fb/settings'));
    const fbSet = fbSetInstance(null);
    await fbSet.setThreadSettings({});

    rewiremock.disable();
    rewiremock.clear();

    const constants = require('../src/common/constants');

    assert.equal(_.get(rpData, 'url'), constants.getFacebookGraphURL('/me/thread_settings'));
    assert.equal(_.get(rpData, 'method'), 'POST');
  });

  it('testing greetingText', async () => {
    let rpData = null;

    rewiremock('request-promise').with(async (data) => {
      rpData = data;
      return { statusCode: 200 };
    });

    rewiremock.enable();

    const fbSetInstance = require(rewiremock.resolve('../src/fb/settings'));
    const fbSet = fbSetInstance(null);
    await fbSet.greetingText('hello');

    rewiremock.disable();
    rewiremock.clear();

    assert.equal(_.get(rpData, 'url'), 'https://graph.facebook.com/v2.9/me/thread_settings');
    assert.equal(_.get(rpData, 'method'), 'POST');
    assert.equal(_.get(rpData, 'json.setting_type'), 'greeting');
    assert.equal(_.get(rpData, 'json.greeting.text'), 'hello');
  });

  it('testing getStartedButton', async () => {
    let rpData = null;

    rewiremock('request-promise').with(async (data) => {
      rpData = data;
      return { statusCode: 200 };
    });

    rewiremock.enable();

    const fbSetInstance = require(rewiremock.resolve('../src/fb/settings'));
    const fbSet = fbSetInstance(null);
    await fbSet.getStartedButton('hello');

    rewiremock.disable();
    rewiremock.clear();

    assert.equal(_.get(rpData, 'url'), 'https://graph.facebook.com/v2.9/me/thread_settings');
    assert.equal(_.get(rpData, 'method'), 'POST');
    assert.equal(_.get(rpData, 'json.setting_type'), 'call_to_actions');
    assert.equal(_.get(rpData, 'json.thread_state'), 'new_thread');
    assert.equal(_.get(rpData, 'json.call_to_actions[0].payload'), 'hello');
  });

  it('testing persistentMenu', async () => {
    let rpData = null;

    rewiremock('request-promise').with(async (data) => {
      rpData = data;
      return { statusCode: 200 };
    });

    rewiremock.enable();

    const fbSetInstance = require(rewiremock.resolve('../src/fb/settings'));
    const fbSet = fbSetInstance(null);
    await fbSet.persistentMenu([
      { type: 'postback', title: 'Yes', payload: 'Yes' },
      { type: 'postback', title: 'No', payload: 'No' }
    ]);

    rewiremock.disable();
    rewiremock.clear();

    assert.equal(_.get(rpData, 'url'), 'https://graph.facebook.com/v2.9/me/thread_settings');
    assert.equal(_.get(rpData, 'method'), 'POST');
    assert.equal(_.get(rpData, 'json.setting_type'), 'call_to_actions');
    assert.equal(_.get(rpData, 'json.thread_state'), 'existing_thread');
    assert.equal(_.get(rpData, 'json.call_to_actions', []).length, 2);
    assert.equal(_.get(rpData, 'json.call_to_actions[0].type'), 'postback');
    assert.equal(_.get(rpData, 'json.call_to_actions[0].title'), 'Yes');
    assert.equal(_.get(rpData, 'json.call_to_actions[0].payload'), 'Yes');
  });

  it('testing deletePersistentMenu', async () => {
    let rpData = null;

    rewiremock('request-promise').with(async (data) => {
      rpData = data;
      return { statusCode: 200 };
    });

    rewiremock.enable();

    const fbSetInstance = require(rewiremock.resolve('../src/fb/settings'));
    const fbSet = fbSetInstance(null);
    await fbSet.deletePersistentMenu();

    rewiremock.disable();
    rewiremock.clear();

    assert.equal(_.get(rpData, 'url'), 'https://graph.facebook.com/v2.9/me/thread_settings');
    assert.equal(_.get(rpData, 'method'), 'DELETE');
    assert.equal(_.get(rpData, 'json.setting_type'), 'call_to_actions');
    assert.equal(_.get(rpData, 'json.thread_state'), 'existing_thread');
    assert.equal(_.get(rpData, 'json.call_to_actions', []).length, 0);
  });
});
