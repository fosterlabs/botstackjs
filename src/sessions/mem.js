const uuid = require('uuid');
const Promise = require('bluebird');
const co = Promise.coroutine;

let sessionMap = new Map();

const maxSessionAge_ms = 1000 * 60 * 180;

const set = (senderId) => {
    return new Promise((resolve, reject) => {
        let mapObj = {
            sessionId: uuid.v1(),
            lastUsed: new Date()
        };
        if (sessionMap.has(senderId)) {
            mapObj = sessionMap.get(senderId);
            mapObj.lastUsed = new Date();
        }
        sessionMap.set(senderId, mapObj);
        resolve();
    });
};

const get = co(function* (senderId, autoCreate) {
    autoCreate = typeof(autoCreate) !== 'undefined' ? autoCreate: false;
    let item = sessionMap.get(senderId);
    if (!item && autoCreate) {
        item = yield set(senderId);
    }
    return item ? item.sessionId : null;
});

let checkExists = co(function* (senderId) {
    let item = yield get(senderId);
    if (item) {
        return true;
    } else {
        return false;
    }
});

function printSessions() {
    sessionMap.forEach((item, key) => {
        console.log('SenderID:' + key + ' SessionId:' + item.sessionId + ' Last Used:' + item.lastUsed);
    });
};


function clearOldSessions() {
    let now = new Date();
    let sessionSize = sessionMap.size;
    sessionMap.forEach((item, key, map) => {
        if(Math.abs(now - item.lastUsed) > maxSessionAge_ms) {
            map.delete(key);
        }
    });
    console.log('Session Size ' + sessionMap.size + ' items. Removed ' + (sessionSize - sessionMap.size) + ' items');
};

//run frequently to remove sessions
setInterval(clearOldSessions, maxSessionAge_ms);

module.exports = { set, get, printSessions, checkExists };
