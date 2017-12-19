const utils = require('../utils');

function structuredMessage(message) {
  const buttons = [];
  for (const button of message.buttons) {
    if ('postback' in button) {
      // fix API.AI bug:
      // https://discuss.api.ai/t/bug-in-facebook-cards-with-url-buttons/7276
      if (utils.checkValidURL(button.postback)) {
        buttons.push({
          type: 'web_url',
          title: button.text,
          url: button.postback
        });
      } else {
        buttons.push({
          type: 'postback',
          title: button.text,
          payload: button.postback
        });
      }
      //
    } else if ('url' in button) {
      buttons.push({
        type: 'web_url',
        title: button.text,
        url: button.url
      });
    }
  }

  const element = {
    title: message.title,
    subtitle: message.subtitle,
    image_url: message.imageUrl
  };

  if (buttons.length > 0) {
    element.buttons = buttons;
  }

  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'generic',
        elements: [element]
      }
    }
  };
}

function textMessage(message) {
  if (message == '') {
    return null;
  }
  return {
    text: message
  };
}

// pass into this method the `messages` section of the api.ai response
// message: {
//  title: 'Yes',
//  replies" [
//   "No", "Maybe"
//  ],
//  type: 2
// }
function quickReply(apiai_qr) {
  const quick_replies = [];

  for (const repl of apiai_qr.replies) {
    quick_replies.push({
      content_type: 'text',
      title: repl,
      payload: repl
    });
  }

  return {
    text: apiai_qr.title,
    quick_replies
  };
}

function imageReply(message) {
  return {
    attachment: {
      type: 'image',
      payload: {
        url: message.imageUrl || message.url
      }
    }
  };
}

function videoReply(message) {
  return {
    attachment: {
      type: 'video',
      payload: {
        url: message.url
      }
    }
  };
}

function audioReply(message) {
  return {
    attachment: {
      type: 'audio',
      payload: {
        url: message.url
      }
    }
  };
}

function fileReply(message) {
  return {
    attachment: {
      type: 'file',
      payload: {
        url: message.url
      }
    }
  };
}

function customMessageReply(message) {
  if ('payload' in message) {
    if ('facebook' in message.payload) {
      if ('attachment' in message.payload.facebook) {
        switch (message.payload.facebook.attachment.type) {
          case 'video':
            return videoReply(message.payload.facebook.attachment.payload);
          case 'audio':
            return audioReply(message.payload.facebook.attachment.payload);
          case 'file':
            return fileReply(message.payload.facebook.attachment.payload);
          case 'image':
            return imageReply(message.payload.facebook.attachment.payload);
        }
      }
    }
  }
}

function imageCard(thumbUrl, downloadUrl, instaUrl, authName) {
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'generic',
        elements: [
          {
            title: `${authName} on Instagram`,
            item_url: instaUrl,
            image_url: thumbUrl,
            buttons: [
              {
                type: 'web_url',
                url: downloadUrl,
                title: 'Download'
              },
              {
                type: 'element_share'
              }
            ]
          }]
      }
    }
  };
}

function youtubeVideoCard(thumbUrl, downloadUrl, originalUrl) {
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'generic',
        elements: [
          {
            title: 'Youtube Video',
            item_url: originalUrl,
            image_url: thumbUrl,
            buttons: [
              {
                type: 'web_url',
                url: downloadUrl,
                title: 'Download'
              },
              {
                type: 'element_share'
              }
            ]
          }]
      }
    }
  };
}

function imageAttachment(thumbUrl) {
  return {
    attachment: {
      type: 'image',
      payload: {
        url: thumbUrl
      }
    }
  };
}

function genericMessage() {
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'generic',
        elements: [{
          title: 'First card',
          subtitle: 'Element #1 of an hscroll',
          image_url: 'http://messengerdemo.parseapp.com/img/rift.png',
          buttons: [{
            type: 'web_url',
            url: 'https://www.messenger.com',
            title: 'web url'
          }, {
            type: 'postback',
            title: 'Postback',
            payload: 'Payload for first element in a generic bubble'
          }]
        }, {
          title: 'Second card',
          subtitle: 'Element #2 of an hscroll',
          image_url: 'http://messengerdemo.parseapp.com/img/gearvr.png',
          buttons: [{
            type: 'postback',
            title: 'Postback',
            payload: 'Payload for second element in a generic bubble'
          }]
        }]
      }
    }
  };
}

module.exports = {
  structuredMessage,
  textMessage,
  quickReply,
  imageReply,
  videoReply,
  audioReply,
  fileReply,
  customMessageReply,
  imageCard,
  youtubeVideoCard,
  imageAttachment,
  genericMessage
};
