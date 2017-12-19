const rp = require('request-promise');
const log = require('../log');
const constants = require('../common/constants');
const env = require('../multiconf')();

async function setThreadSettings(data, method = 'POST', { pageId=null}={}) {
  const reqData = {
    url: constants.getFacebookGraphURL('/me/thread_settings'),
    qs: {
      access_token: env.getFacebookPageTokenByPageID(pageId)
    },
    resolveWithFullResponse: true,
    method,
    json: data
  };
  try {
    const response = await rp(reqData);
    if (response.statusCode == 200) {
      log.debug('Sent settings to Facebook', {
        module: 'botstack:fb'
      });
      return response.body;
    }
    log.error('Error in Facebook response', {
      module: 'botstack:fb', response: response.body
    });
    throw new Error(`Error in Facebook response: ${response.body}`);
  } catch (e) {
    log.error(e, {
      module: 'botstack:fb'
    });
    throw e;
  }
}

function greetingText(text) {
  log.debug('Sending greeting text', {
    module: 'botstack:fb'
  });
  const data = {
    setting_type: 'greeting',
    greeting: {
      text
    }
  };
  return setThreadSettings(data);
}

function getStartedButton(payload) {
  payload = typeof (payload) !== 'undefined' ? payload : 'Get Started';
  log.debug('Sending started button', {
    module: 'botstack:fb'
  });
  const data = {
    setting_type: 'call_to_actions',
    thread_state: 'new_thread',
    call_to_actions: [
            { payload }
    ]
  };
  return setThreadSettings(data);
}

/*
[{ type: "postback", title: "Yes", payload: "Yes" },
 { type: "postback", title: "Help", payload: "Help" }]
*/
function persistentMenu(call_to_actions) {
  log.debug('Sending persistent menu settings', {
    module: 'botstack:fb'
  });
  const data = {
    setting_type: 'call_to_actions',
    thread_state: 'existing_thread',
    call_to_actions
  };
  return setThreadSettings(data);
}

function deletePersistentMenu() {
  log.debug('Delete persistent menu settings', {
    module: 'botstack:fb'
  });
  const data = {
    setting_type: 'call_to_actions',
    thread_state: 'existing_thread'
  };
  return setThreadSettings(data, 'DELETE');
}

module.exports = {
  setThreadSettings,
  greetingText,
  getStartedButton,
  persistentMenu,
  deletePersistentMenu
};
