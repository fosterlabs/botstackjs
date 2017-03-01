//We need to persist a map of session ids against users
//when we rx a message from fb, store the senderId alongside a UUID
//store the date and time when a session is added or updated so they can be pruned
const Promise = require('bluebird');
const co = Promise.coroutine;

const client = require('./redis');

const uuid = require('uuid');
const maxSessionAge_ms = 1000 * 60 * 180;

/**
 * Add new session
 * @param {string} senderId - sender ID
 * @return {bool} true if new session created, false if session exists
*/
let set = co(function* (senderId) {
    let sessionExists = yield client.hexistsAsync("sessions", senderId);
    if (sessionExists == 0) {
        let data = {
            sessionId: uuid.v1(),
            lastUsed: new Date()
        };
        let res = yield client.hsetAsync("sessions", senderId, JSON.stringify(data));
        if (res == 0) {
            return false;
        } else {
            return true;
        }
    } else {
        let data = yield client.hgetAsync("sessions", senderId);
        data = JSON.parse(data);
        data.lastUsed = new Date();
        let res = yield client.hsetAsync("sessions", senderId, JSON.stringify(data));
        if (res == 0) {
            return false;
        } else {
            return true;
        }
    }
});

/**
 * Get existing session data
 * @param {string} senderId - sender ID
 * @param {bool} autoCreate - if true session will be autocreated if not found (default false)
 * @return {object} session data or null if not found
*/
let get = co(function* (senderId, autoCreate) {
    autoCreate = typeof(autoCreate) !== 'undefined' ? autoCreate: false;
    let sessionExists = yield client.hexistsAsync("sessions", senderId);
    if (sessionExists == 1) {
        let data = yield client.hgetAsync("sessions", senderId);
        return JSON.parse(data).sessionId;
    } else {
        if (autoCreate) {
            let res = yield set(senderId);
            return res.sessionId;
        } else {
            return null;
        }
    }
});

let checkExists = co(function* (senderId) {
    let item = yield get(senderId);
    if (item) {
        return true;
    } else {
        return false;
    }
});

let printSessions = co(function* () {
    let data = yield client.hgetallAsync("sessions");
    for (key in data) {
        let itemVal = JSON.parse(data[key]);
        console.log('SenderID:' + key + ' SessionId:' + itemVal.sessionId + ' Last Used:' + itemVal.lastUsed);
    };
});

let clearOldSessions = co(function* () {
    let not = new Date();
    let sessionsSize = yield client.hlenAsync("sessions");
    let sessions = yield client.hgetallAsync("sessions");
    for (senderId in sessions) {
        let data = JSON.parse(sessions[senderId]);
        if (Math.abs(now - data.lastUsed) > maxSessionAge_ms) {
            client.hdelAsync("sessions", senderId);
        }
    }
    let sessionsSizeNow = yield client.hlenAsync("sessions");
    console.log('Session Size ' + sessionsSizeNow + ' items. Removed ' + (sessionsSize - sessionsSizeNow) + ' items');
});

//run frequently to remove sessions
// FIXME: move to job queue (this will not work on multi instance mode)
setInterval(clearOldSessions, maxSessionAge_ms);

exports.set = set;
exports.get = get;
exports.printSessions = printSessions;
exports.clearOldSessions = clearOldSessions;
exports.checkExists = checkExists;
