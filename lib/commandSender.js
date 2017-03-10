var ansi = require('ansi_up'),
    prompts = require('./constants').prompts,
    ansiToText = ansi.ansi_to_text;

function sendCommandBatch(batch) {
  this.commands = batch;
  this.connection.removeEventListener('message', this.receiveCommandOutput);
  this.connection.addEventListener('message', this.receiveCommandOutput);
  this.sendCommandInput(this.commands.shift());
}

function sendCommandInput(command) {
  if (command !== undefined) {
    this.currentCommand = command;
    this.connection.send(command + '\n');
  }
}

function receiveCommandOutput(output) {
  var self = this;

  // setTimeout(function() {
    self.outputs.push(output.data);

    var outputText = self.outputs.join('');

    global.console.log('receiveCommandOutput:before', [self.currentCommand, outputText]);

    if (outputText.match(/\n/)) {
      var completeMessage = outputText,
          lines = completeMessage.split('\n').filter(function(line) { return line; }),
          lastLine = lines[lines.length - 1];

      global.console.log('receiveCommandOutput:after:if', lines.map(ansiToText));
      self.outputs.length = 0;

      if (ansiToText(outputText.split('\n').pop()).match(prompts[self.language])) {
        self.outputs.push(outputText.split('\n').pop());
      }
      else {
        global.console.log('receiveCommandOutput:after:else', lines.map(ansiToText));
        self.emit('end', lines);
      }
    }
  // }, 10);

  // setTimeout(function() {
    // self.outputs.push(output.data);

    // var completeMessage = self.outputs.join(''),
    //     lines = completeMessage.split('\n'),
    //     lastLine = lines[lines.length - 1];

    // if (
    //   lastLine &&
    //   (
    //     lastLine.match(prompts[self.language]) ||
    //     ansiToText(lastLine).trim().match(prompts[self.language])
    //   ) ||
    //   lastLine.match('\n')
    // ) {
    //   // self.connection.removeEventListener('message', self.receiveCommandOutput);
    //   self.emit('end', lines, completeMessage);
    //   self.outputs.length = 0;
    // }
  // }, 0);
}

module.exports = {
  sendCommandBatch: sendCommandBatch,
  sendCommandInput: sendCommandInput,
  receiveCommandOutput: receiveCommandOutput
};