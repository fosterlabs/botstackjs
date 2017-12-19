const _ = require('lodash');
const rewiremock = require('rewiremock').default;
const { addPlugin, plugins } = require('rewiremock');

addPlugin(plugins.relative);
addPlugin(plugins.usedByDefault);

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const assert = chai.assert;

describe('Tesing FB upload', () => {
  it('fb upload', async () => {
    let rpData = null;

    rewiremock('request-promise').with(async (data) => {
      rpData = data;
      return { statusCode: 200 };
    });

    rewiremock.enable();

    const fbInstance = require(rewiremock.resolve('../src/fb/upload'));
    const fb = fbInstance(null);
    await fb.attachmentUpload('http://example.com/demo.jpg', 'image');

    rewiremock.disable();
    rewiremock.clear();

    assert.equal(_.get(rpData, 'json.message.attachment.type'), 'image');
    assert.equal(_.get(rpData, 'json.message.attachment.payload.url'), 'http://example.com/demo.jpg');
    assert.equal(_.get(rpData, 'json.message.attachment.payload.is_reusable'), true);
    assert.equal(_.get(rpData, 'url'), 'https://graph.facebook.com/v2.9/me/message_attachments');
  });
});
