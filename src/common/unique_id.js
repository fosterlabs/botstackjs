function getUniqueId(senderId, pageId) {
  return `${pageId}_${senderId}`;
}

module.exports = {
  getUniqueId
};
