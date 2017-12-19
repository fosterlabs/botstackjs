const _ = require('lodash');
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

    rewiremock('../multiconf').with(() => ({
      getEnv: envName => '123',
      getFacebookPageTokenByPageID: envName => '123'
    }));

    rewiremock.enable();
    rewiremock.isolation();

    const fbInstance = require(rewiremock.resolve('../src/fb/reply'));
    const fbMsg = require(rewiremock.resolve('../src/fb/message_types'));
    const senderID = '1234567890';
    let fb = fbInstance(null);
    await fb.reply(fbMsg.textMessage('hello'), senderID);

    rewiremock.disable();
    rewiremock.clear();

    assert.equal(_.get(rpData, 'method'), 'POST');
    assert.equal(_.get(rpData, 'json.recipient.id'), senderID);
    assert.equal(_.get(rpData, 'json.message.text'), 'hello');
    assert.isOk(_.has(rpData, 'qs.access_token'));
    assert.isOk(_.has(rpData, 'url'));
    assert.equal(_.get(rpData, 'qs.access_token'), '123');
  });
});
