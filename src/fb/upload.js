const rp = require('request-promise');
const log = require('../log');
const env = require('../multiconf')();
const constants = require('../common/constants');

async function attachmentUpload(attachmentURL, attachmentType = 'video', { pageId=null }={}) {
  const msg = {
    message: {
      attachment: {
        type: attachmentType,
        payload: {
          url: attachmentURL,
          is_reusable: true
        }
      }
    }
  };

  const reqData = {
    url: constants.getFacebookGraphURL('/me/message_attachments'),
    qs: {
      access_token: env.getFacebookPageTokenByPageID(pageId)
    },
    resolveWithFullResponse: true,
    method: 'POST',
    json: msg
  };

  try {
    const resp = await rp(reqData);
    if (resp.statusCode == 200) {
      log.debug('Upload file to Facebook', {
        module: 'fb',
        url: attachmentURL
      });
      return resp.body;
    } else if (resp.statusCode == 400) {
      log.error('Upload file to Facebook', {
        module: 'fb',
        url: attachmentURL,
        error: resp.error
      });
      return false;
    } else if (resp.statusCode !== 200) {
      log.error('Upload file to Facebook', {
        module: 'fb',
        url: attachmentURL,
        response: resp.body
      });
      return false;
    }

    return true;
  } catch (e) {
    log.error(e, {
      module: 'fb'
    });
    throw e;
  }
}

module.exports = {
  attachmentUpload
};
