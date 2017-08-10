const lodash = require('lodash');
const rewiremock = require('rewiremock').default;
const { addPlugin, plugins } = require('rewiremock');

addPlugin(plugins.relative);
addPlugin(plugins.usedByDefault);

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const assert = chai.assert;

describe('Testing FB reply', () => {
  it('fb reply', async () => {

    let rpData = null;

    rewiremock('request-promise').with(async (data) => {
      rpData = data;
      return null;
    });

    rewiremock.enable();
    rewiremock.isolation();

    const fb = require(rewiremock.resolve('../src/fb/reply'));
    const fbMsg = require(rewiremock.resolve('../src/fb/message_types'));
    const senderID = '1234567890';
    await fb.reply(fbMsg.textMessage('hello'), senderID);

    rewiremock.disable();
    rewiremock.clear();

    assert.equal(lodash.get(rpData, 'method'), 'POST');
    assert.equal(lodash.get(rpData, 'json.recipient.id'), senderID);
    assert.equal(lodash.get(rpData, 'json.message.text'), 'hello');
    assert.isOk(lodash.has(rpData, 'qs.access_token'));
    assert.isOk(lodash.has(rpData, 'url'));
  });
});
