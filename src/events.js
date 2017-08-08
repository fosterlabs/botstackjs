const EventEmitter = require('events');

class BotStackEmitter extends EventEmitter {}

const BotStackEvents = new BotStackEmitter();

const botStackHandlers = null;

function BotStackEmitterInit(handlers = {}) {
  if (Object.keys(handlers).length > 0) {
    for (const e in handlers) {
      if (BotStackEvents.listenerCount(e) == 0) {
        BotStackEvents.on(e, handlers[e]);
      }
    }
  }
}

function BotStackCheck(handleName) {
  return BotStackEvents.listenerCount(handleName) > 0;
}

module.exports = {
  BotStackEvents, BotStackEmitterInit, BotStackCheck
};
