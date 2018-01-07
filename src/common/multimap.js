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

async function setAsync(key, value = {}) {
  set(key, value);
}

const get = (key) => {
  const item = multiMap.get(key);
  if (!item) {
    return null;
  }
  return item;
};

function dropAll() {
  for (const key of multiMap.keys()) {
    multiMap.delete(key);
  }
}

async function getAsync(key) {
  return get(key);
}

const del = key => multiMap.delete(key);

async function delAsync(key) {
  return del(key);
}

const delByInternalKey = (key, internalKey) => {
  const oldValue = multiMap.get(key);
  if (!oldValue) {
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
  delByInternalKeyAsync,
  dropAll
};
