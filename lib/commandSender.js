var ansi = require('ansi_up'),
    prompts = require('./constants').prompts,
    ansiToText = ansi.ansi_to_text;

function sendCommandBatch(batch) {
  this.commands = batch;
  this.sendCommandInput(this.commands.shift());
}

function sendCommandInput(command) {
  this.currentCommand = command;
  this.connection.addEventListener('message', this.receiveCommandOutput);
  this.connection.send(command + '\n');
}

function receiveCommandOutput(message) {
  var self = this;

  setTimeout(function() {
    self.messages.push(message.data);

    var completeMessage = self.messages.join(''),
        lines = completeMessage.split('\n'),
        lastLine = lines[lines.length - 1];

    if (
      lastLine &&
      (
        lastLine.match(prompts[self.language]) ||
        ansiToText(lastLine).trim().match(prompts[self.language])
      )
    ) {
      self.connection.removeEventListener('message', self.receiveCommandOutput);
      self.emit('end', lines, completeMessage);
      self.messages.length = 0;
    }
  }, 10);
}

module.exports = {
  sendCommandBatch: sendCommandBatch,
  sendCommandInput: sendCommandInput,
  receiveCommandOutput: receiveCommandOutput
};