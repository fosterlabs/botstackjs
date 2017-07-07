const Promise = require('bluebird');
const co = Promise.coroutine;
const lodash = require('lodash');
let stateMap = new Map();

const set = (senderId, stateValue = {}) => {
    return new Promise((resolve, reject) => {
        const oldVal = stateMap.get(senderId);
        if (oldVal) {
            const newOne = lodash.cloneDeep(lodash.merge(oldVal, stateValue));
            stateMap.set(senderId, newOne);
        } else {
            stateMap.set(senderId, lodash.cloneDeep(stateValue));
        }
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

const del = (senderID) => {
    return new Promise((resolve, reject) => {
        const result = stateMap.delete(senderID);
        resolve(result);
    });
};

const delKey = (senderID, keyName) => {
    return new Promise((resolve, reject) => {
        const oldVal = stateMap.get(senderID);
        delete oldVal[keyName];
        stateMap.set(senderID, oldVal);
        resolve();
    });
}

module.exports = { set, get, del, delKey };
