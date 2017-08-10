const uuid = require('uuid');

const sessionMap = new Map();
const maxSessionAge_ms = 1000 * 60 * 180;

async function set(senderID) {
  let mapObj = {
    sessionID: uuid.v1(),
    lastUsed: new Date()
  };
  if (sessionMap.has(senderID)) {
    mapObj = sessionMap.get(senderID);
    mapObj.lastUsed = new Date();
  }
  sessionMap.set(senderID, mapObj);
  return mapObj;
}

async function get(senderID, autoCreate = true) {
  let item = sessionMap.get(senderID);
  if (!item && autoCreate) {
    item = await set(senderID);
  }
  return item || null;
}

async function checkExists(senderID) {
  const item = await get(senderID);
  if (item) {
    return true;
  }
  return false;
}

function clearOldSessions() {
  const now = new Date();
  const sessionSize = sessionMap.size;
  sessionMap.forEach((item, key, map) => {
    if (Math.abs(now - item.lastUsed) > maxSessionAge_ms) {
      map.delete(key);
    }
  });
    // console.log('Session Size ' + sessionMap.size + ' items. Removed ' + (sessionSize - sessionMap.size) + ' items');
}

setInterval(clearOldSessions, maxSessionAge_ms);
module.exports = { set, get, checkExists };
