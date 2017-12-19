const Promise = require('bluebird');
const _ = require('lodash');

const multiMap = new Map();

const set = (key, value = {}) => {
  const oldValue = multiMap.get(key);
  if (oldValue) {
    const newValue = _.cloneDeep(_.merge(oldValue, value));
    multiMap.set(key, newValue);
  } else {
    multiMap.set(key, _.cloneDeep(value));
  }
};

const setAsync = (key, value = {}) => new Promise((resolve, reject) => {
  set(key, value);
  resolve();
});

const get = (key) => {
  const item = multiMap.get(key);
  if (!item) {
    return null;
  } else {
    return item;
  }
};

const getAsync = key => new Promise((resolve, reject) => {
  resolve(get(key));
});

const del = key => {
  return multiMap.delete(key);
};

const delAsync = key => new Promise((resolve, reject) => {
  resolve(del(key));
});

const delByInternalKey = (key, internalKey) => {
  const oldValue = multiMap.get(key);
  if (!oldValue) {
    reject("Internal key doesn't exists");
    throw new Error("Internal key doesn't exists");
  }
  delete oldValue[internalKey];
  multiMap.set(key, oldValue);
  return true;
};

const delByInternalKeyAsync = (key, internalKey) => new Promise((resolve, reject) => {
  try {
    resolve(delByInternalKey(key, internalKey));
  } catch (err) {
    reject(err);
  }
});

module.exports = {
  set,
  setAsync,
  get,
  getAsync,
  del,
  delAsync,
  delByInternalKey,
  delByInternalKeyAsync
};
