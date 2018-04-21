const rp = require('request-promise');
const log = require('../log');
const constants = require('../common/constants');
const multiconf = require('../multiconf');

let self = null;

async function setThreadSettings(data, method = 'POST', { pageId = null } = {}) {
  const env = multiconf(self);
  const FB_PAGE_ACCESS_TOKEN = await env.getFacebookPageTokenByPageID(pageId);
  const reqData = {
    url: constants.getFacebookGraphURL('/me/thread_settings'),
    qs: {
      access_token: FB_PAGE_ACCESS_TOKEN
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

async function greetingText(text, pageId = null) {
  log.debug('Sending greeting text', {
    module: 'botstack:fb'
  });
  const data = {
    setting_type: 'greeting',
    greeting: {
      text
    }
  };
  let result = null;
  if (pageId) {
    result = await setThreadSettings(data, 'POST', { pageId: pageId });
  } else {
    result = await setThreadSettings(data);
  }
  return result;
}

async function getStartedButton(payload, pageId = null) {
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
  let result = null;
  if (pageId) {
    result = await setThreadSettings(data, 'POST', { pageId: pageId });
  } else {
    result = await setThreadSettings(data);
  }
  return result;
}

/*
  [{ type: "postback", title: "Yes", payload: "Yes" },
  { type: "postback", title: "Help", payload: "Help" }]
*/
async function persistentMenu(call_to_actions, pageId = null) {
  log.debug('Sending persistent menu settings', {
    module: 'botstack:fb'
  });
  const data = {
    setting_type: 'call_to_actions',
    thread_state: 'existing_thread',
    call_to_actions
  };
  let result = null;
  if (pageId) {
    result = await setThreadSettings(data, 'POST', { pageId });
  } else {
    result = await setThreadSettings(data);
  }
  return result;
}

async function deletePersistentMenu() {
  log.debug('Delete persistent menu settings', {
    module: 'botstack:fb'
  });
  const data = {
    setting_type: 'call_to_actions',
    thread_state: 'existing_thread'
  };
  const result = await setThreadSettings(data, 'DELETE');
  return result;
}


module.exports = (botstackInstance) => {
  self = botstackInstance;

  return {
    setThreadSettings,
    greetingText,
    getStartedButton,
    persistentMenu,
    deletePersistentMenu
  };
};
