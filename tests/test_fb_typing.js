const lodash = require('lodash');
const rewiremock = require('rewiremock').default;
const { addPlugin, plugins } = require('rewiremock');

addPlugin(plugins.relative);
addPlugin(plugins.usedByDefault);

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const assert = chai.assert;

describe('Testing FB typing', () => {
  it('fb typing on', async () => {
    let rpData = null;

    rewiremock('request-promise').with(async (data) => {
      rpData = data;
      return { statusCode: 200 };
    });

    rewiremock.enable();
    rewiremock.isolation();

    const fb = require(rewiremock.resolve('../src/fb/typing'));
    const senderID = '1234567890';
    await fb.typing(senderID, true);

    rewiremock.disable();
    rewiremock.clear();

    assert.equal(lodash.get(rpData, 'method'), 'POST');
    assert.equal(lodash.get(rpData, 'json.recipient.id'), senderID);
    assert.equal(lodash.get(rpData, 'json.sender_action'), 'typing_on');
  });

  it('fb typing off', async () => {
    let rpData = null;

    rewiremock('request-promise').with(async (data) => {
      rpData = data;
      return { statusCode: 200 };
    });

    rewiremock.enable();
    rewiremock.isolation();

    const fb = require(rewiremock.resolve('../src/fb/typing'));
    const senderID = '1234567890';
    await fb.typing(senderID);

    rewiremock.disable();
    rewiremock.clear();

    assert.equal(lodash.get(rpData, 'method'), 'POST');
    assert.equal(lodash.get(rpData, 'json.recipient.id'), senderID);
    assert.equal(lodash.get(rpData, 'json.sender_action'), 'typing_off');
  });
});
