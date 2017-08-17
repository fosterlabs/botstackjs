const { processMessagesFromApiAi } = require('./apiai');
const { reply } = require('./reply');
const { typing } = require('./typing');
const { attachmentUpload } = require('./upload');
const {
  greetingText,
  getStartedButton,
  persistentMenu,
  deletePersistentMenu
} = require('./settings');
const {
  textMessage,
  quickReply,
  genericMessage,
  structuredMessage,
  imageCard,
  imageAttachment,
  youtubeVideoCard,
  imageReply
} = require('./message_types');

const { setPersistentMenuViaProfile } = require('./persistent_menu');

module.exports = {
  processMessagesFromApiAi,
  reply,
  typing,
  attachmentUpload,
  greetingText,
  getStartedButton,
  persistentMenu,
  setPersistentMenuViaProfile,
  deletePersistentMenu,
  textMessage,
  quickReply,
  genericMessage,
  structuredMessage,
  imageCard,
  imageAttachment,
  youtubeVideoCard,
  imageReply
};
