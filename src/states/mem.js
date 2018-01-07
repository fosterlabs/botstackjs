const Promise = require('bluebird');

const co = Promise.coroutine;
const _ = require('lodash');

const stateMap = new Map();

const set = (senderId, stateValue = {}) => new Promise((resolve, reject) => {
  const oldVal = stateMap.get(senderId);
  if (oldVal) {
    const newOne = _.cloneDeep(_.merge(oldVal, stateValue));
    stateMap.set(senderId, newOne);
  } else {
    stateMap.set(senderId, _.cloneDeep(stateValue));
  }
  resolve();
});

const get = senderID => new Promise((resolve, reject) => {
  const item = stateMap.get(senderID);
  if (!item) {
    resolve(null);
  } else {
    resolve(item);
  }
});

const del = senderID => new Promise((resolve, reject) => {
  const result = stateMap.delete(senderID);
  resolve(result);
});

const delKey = (senderID, keyName) => new Promise((resolve, reject) => {
  const oldVal = stateMap.get(senderID);
  delete oldVal[keyName];
  stateMap.set(senderID, oldVal);
  resolve();
});

module.exports = { set, get, del, delKey };
