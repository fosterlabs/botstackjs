const client = require('../redis');
const uuid = require('uuid');

// const maxSessionAge_ms = 1000 * 60 * 180; // 3 h
// const maxSessionAge_sec = 60 * 180; // 3 h

const KEY_PREFIX = 'bs';
const KEY_SESSIONS = `${KEY_PREFIX}:sessions`;

async function set(senderID, sessionAge_sec = 60 * 180) {
    //
    const sessionKey = `${KEY_SESSIONS}:${senderID}`;
    const sessionExists = await client.keysAsync(sessionKey);
    if (sessionExists.length == 0) {
        const data = {
            sessionId: uuid.v1(),
            lastUsed: new Date()
        };
        const res = await client.setAsync(sessionKey, JSON.stringify(data), 'EX', sessionAge_sec);
        if (res === 0) {
            return false;
        } else {
            return data;
        }
    } else {
        let data = await client.getAsync(sessionKey);
        data = JSON.parse(data);
        data.lastUsed = new Date();
        const res = await client.setAsync(sessionKey, JSON.stringify(data), 'EX', sessionAge_sec);
        if (res === 0) {
            return false;
        } else {
            return data;
        }
    }
    //
    /*
    const sessionExists = await client.hexistsAsync("sessions", senderID);
    if (sessionExists == 0) {
        const data = {
            sessionId: uuid.v1(),
            lastUsed: new Date()
        };
        const res = await client.hsetAsync("sessions", senderID, JSON.stringify(data));
        if (res == 0) {
            return false;
        } else {
            return true;
        }
    } else {
        const data = await client.hgetAsync("sessions", senderID);
        data = JSON.parse(data);
        data.lastUsed = new Date();
        const res = await client.hsetAsync("sessions", senderID, JSON.stringify(data));
        if (res == 0) {
            return false;
        } else {
            return true;
        }
    }
    */
}

async function get(senderID, autoCreate = false) {
    const sessionKey = `${KEY_SESSIONS}:${senderID}`;
    const sessionExists = await client.keysAsync(sessionKey);
    if (sessionExists.length === 0) {
        if (autoCreate) {
            const result = await set(senderID);
            return result;
        } else {
            return null;
        }
    } else {
        const data = await client.getAsync(sessionKey);
        return data;
    }
    /*
    const sessionExists = await client.hexistsAsync("sessions", senderID);
    if (sessionExists == 1) {
        const data = await client.hgetAsync("sessions", senderID);
        return JSON.parse(data).sessionId;
    } else {
        if (autoCreate) {
            const res = await set(senderID);
            return res.sessionId;
        } else {
            return null;
        }
    }
    */
}

async function checkExists(senderID) {
    const item = await get(senderID);
    if (item) {
        return true;
    } else {
        return false;
    }
}

module.exports = {
    get,
    set,
    checkExists
};
