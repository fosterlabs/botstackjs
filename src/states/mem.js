const Promise = require('bluebird');
const co = Promise.coroutine;
const lodash = require('lodash');
let stateMap = new Map();

const set = (senderId, stateValue = {}) => {
    return new Promise((resolve, reject) => {
        stateMap.set(senderId, stateValue);
        resolve();
    });
};

const get = (senderID) => {
    return new Promise((resolve, reject) => {
        const item = stateMap.get(senderID);
        if (!item) {
            resolve(null);
        } else {
            resolve(item);
        }
    });
};

module.exports = { set, get };
