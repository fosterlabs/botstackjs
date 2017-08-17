const lodash = require('lodash');
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
    rewiremock.isolation();

    const fbSet = require(rewiremock.resolve('../src/fb/settings'));
    await fbSet.setThreadSettings({});

    rewiremock.disable();
    rewiremock.clear();

    assert.equal(lodash.get(rpData, 'url'), 'https://graph.facebook.com/v2.9/me/thread_settings');
    assert.equal(lodash.get(rpData, 'method'), 'POST');
  });

  it('testing greetingText', async () => {
    let rpData = null;

    rewiremock('request-promise').with(async (data) => {
      rpData = data;
      return { statusCode: 200 };
    });

    rewiremock.enable();
    rewiremock.isolation();

    const fbSet = require(rewiremock.resolve('../src/fb/settings'));
    await fbSet.greetingText('hello');

    rewiremock.disable();
    rewiremock.clear();

    assert.equal(lodash.get(rpData, 'url'), 'https://graph.facebook.com/v2.9/me/thread_settings');
    assert.equal(lodash.get(rpData, 'method'), 'POST');
    assert.equal(lodash.get(rpData, 'json.setting_type'), 'greeting');
    assert.equal(lodash.get(rpData, 'json.greeting.text'), 'hello');
  });

  it('testing getStartedButton', async () => {
    let rpData = null;

    rewiremock('request-promise').with(async (data) => {
      rpData = data;
      return { statusCode: 200 };
    });

    rewiremock.enable();
    rewiremock.isolation();

    const fbSet = require(rewiremock.resolve('../src/fb/settings'));
    await fbSet.getStartedButton('hello');

    rewiremock.disable();
    rewiremock.clear();

    assert.equal(lodash.get(rpData, 'url'), 'https://graph.facebook.com/v2.9/me/thread_settings');
    assert.equal(lodash.get(rpData, 'method'), 'POST');
    assert.equal(lodash.get(rpData, 'json.setting_type'), 'call_to_actions');
    assert.equal(lodash.get(rpData, 'json.thread_state'), 'new_thread');
    assert.equal(lodash.get(rpData, 'json.call_to_actions[0].payload'), 'hello');
  });

  it('testing persistentMenu', async () => {
    let rpData = null;

    rewiremock('request-promise').with(async (data) => {
      rpData = data;
      return { statusCode: 200 };
    });

    rewiremock.enable();
    rewiremock.isolation();

    const fbSet = require(rewiremock.resolve('../src/fb/settings'));
    await fbSet.persistentMenu([
      { type: 'postback', title: 'Yes', payload: 'Yes' },
      { type: 'postback', title: 'No', payload: 'No' }
    ]);

    rewiremock.disable();
    rewiremock.clear();

    assert.equal(lodash.get(rpData, 'url'), 'https://graph.facebook.com/v2.9/me/thread_settings');
    assert.equal(lodash.get(rpData, 'method'), 'POST');
    assert.equal(lodash.get(rpData, 'json.setting_type'), 'call_to_actions');
    assert.equal(lodash.get(rpData, 'json.thread_state'), 'existing_thread');
    assert.equal(lodash.get(rpData, 'json.call_to_actions', []).length, 2);
    assert.equal(lodash.get(rpData, 'json.call_to_actions[0].type'), 'postback');
    assert.equal(lodash.get(rpData, 'json.call_to_actions[0].title'), 'Yes');
    assert.equal(lodash.get(rpData, 'json.call_to_actions[0].payload'), 'Yes');
  });

  it('testing deletePersistentMenu', async () => {
    let rpData = null;

    rewiremock('request-promise').with(async (data) => {
      rpData = data;
      return { statusCode: 200 };
    });

    rewiremock.enable();
    rewiremock.isolation();

    const fbSet = require(rewiremock.resolve('../src/fb/settings'));
    await fbSet.deletePersistentMenu();

    rewiremock.disable();
    rewiremock.clear();

    assert.equal(lodash.get(rpData, 'url'), 'https://graph.facebook.com/v2.9/me/thread_settings');
    assert.equal(lodash.get(rpData, 'method'), 'DELETE');
    assert.equal(lodash.get(rpData, 'json.setting_type'), 'call_to_actions');
    assert.equal(lodash.get(rpData, 'json.thread_state'), 'existing_thread');
    assert.equal(lodash.get(rpData, 'json.call_to_actions', []).length, 0);
  });
});
