const dialogflowInstance = require('./dialogflow');
const replyInstance = require('./reply');
const typingInstance = require('./typing');
const attachmentUploadInstance = require('./upload');
const settingsInstance = require('./settings');
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

const persistentMenuInstance = require('./persistent_menu');

module.exports = (botstackInstance) => {
  const self = botstackInstance;
  const {
    processMessagesFromApiAi,
    processMessagesFromDialogflow
  } = dialogflowInstance(self);
  const { reply } = replyInstance(self);
  const { typing } = typingInstance(self);
  const { attachmentUpload } = attachmentUploadInstance(self);
  const {
    greetingText,
    getStartedButton,
    persistentMenu,
    deletePersistentMenu
  } = settingsInstance(self);
  const { setPersistentMenuViaProfile } = persistentMenuInstance(self);
  return {
    processMessagesFromApiAi,
    processMessagesFromDialogflow,
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
};
