var EventEmitter = require('events').EventEmitter,
    CodePicnic = require('codepicnic'),
    preact = require('preact'),
    CodeBiteView = require('./view/index'),
    ansiToText = require('ansi_up').ansi_to_text,
    extend = require('lodash/extend'),
    flatten = require('lodash/flatten'),
    CommandSender = require('./commandSender'),
    _constants = require('./constants'),
    types = _constants.types,
    startCommands = _constants.startCommands,
    runCommands = _constants.runCommands,
    fileExtensions = _constants.fileExtensions,
    prompts = _constants.prompts,
    newLinePrompts = _constants.newLinePrompts,
    outputPrompts = _constants.outputPrompts;

function CodeBite(options) {
  var self = this;

  this.id = Date.now().toString() + Math.ceil(Math.random() * Date.now());
  this.element = options.element;
  this.type = typeof options.type === 'string' ? types[options.type] : options.type;
  this.language = this.type.language;
  this.content = this.element.textContent || options.content;
  this.containerName = options.containerName;
  this.inContext = options.inContext;
  this.shouldStartContainer = options.shouldStartContainer;
  this.highlights = options.highlights || [];

  this.batch = [];
  this.outputs = [];
  this.receiveCommandOutput = this.receiveCommandOutput.bind(this);

  this.buildContainer();

  this.viewProps = {
    instance: this,
    name: this.type.name
  };

  this.view = preact.render(preact.h(CodeBiteView, { instance: this, name: this.type.name }), this.element);

  if (this.shouldStartContainer) {
    this.startOrCreateContainer().then(function() {
      if (self.type.identifier === 'devpad-nodejs') {
        self.startWSConnection();
      }

      self.buildEvents();
      CodeBite.instances.push(self);
      self.emit('ready');
    });
  }
  else {
    var clientsPresent = (CodeBite.clientKey && CodeBite.clientSecret),
        auth = clientsPresent ? CodePicnic.initialize(CodeBite.clientKey, CodeBite.clientSecret) : CodePicnic.initialize(CodeBite.authToken);

    this.console = new CodePicnic.Console({ containerName: this.containerName, containerType: this.type.identifier, containerSize: 'medium', isHeadless: true, host: 'devpad' });

    if (this.type.identifier === 'devpad-nodejs') {
      this.startWSConnection();
    }

    this.buildEvents();
    CodeBite.instances.push(this);

    auth.then(function() {
      self.emit('ready');
    });
  }
}

CodeBite.baseURL = 'codepicnic.com/repl';
CodeBite.instances = [];
CodeBite.prototype = extend(CodeBite.prototype, EventEmitter.prototype, CommandSender);

CodeBite.prototype.startWSConnection = function() {
  var connectionProtocol = (CodeBite.baseURL.match('localhost') ? 'ws:' : 'wss:'),
      baseURL = connectionProtocol + '//' + CodeBite.baseURL + '/',
      self = this;

  this.connection = new WebSocket(baseURL + this.containerName + '?token=' + CodeBite.authToken);
  this.emit('connection:created');
  this.connection.addEventListener('open', function enableRunButton() {
    self.connection.send(startCommands[self.language]);
    self.connection.removeEventListener('open', enableRunButton);
  });

  this.connection.addEventListener('close', function() {
    setTimeout(self.startWSConnection.bind(self), 500);
  });
};

CodeBite.prototype.startOrCreateContainer = function() {
  var self = this,
      clientsPresent = (CodeBite.clientKey && CodeBite.clientSecret),
      auth = clientsPresent ? CodePicnic.initialize(CodeBite.clientKey, CodeBite.clientSecret) : CodePicnic.initialize(CodeBite.authToken),
      getConsole;

  getConsole = auth.then(function() {
    if (self.containerName) {
      return CodePicnic.Console.get(self.containerName).then(function(console) {
        self.console = console;

        return self.console;
      }, console.log.bind(console));
    }
    else {
      self.console = new CodePicnic.Console({ containerType: self.type.identifier, containerSize: 'medium', isHeadless: true, host: 'devpad' });

      return self.console.save();
    }
  });

  return getConsole.then(function(console) {
    self.containerName = console.get('containerName');

    return console.start().then(function() { return console; });
  });
};

CodeBite.prototype.buildContainer = function() {
  var container = document.createElement('div');

  container.className = 'codebite-block';

  this.element.parentElement.replaceChild(container, this.element);
  this.element = container;
};

CodeBite.prototype.buildEvents = function() {
  var self = this;

  function isOutput(line) {
    // console.log('isOutput', self.commands.length, line, prompts[self.type.language], !line.match(prompts[self.type.language]), (outputPrompts[self.type.language] && line.match(outputPrompts[self.type.language])));
    console.log('isOutput:passFilter', self.passFilter);

    // return (!line.match(prompts[self.type.language]) || (outputPrompts[self.type.language] && line.match(outputPrompts[self.type.language])));
    return (self.passFilter ? true : !line.match(prompts[self.type.language]));
  }

  function removeNewLinePrompt(line) {
    return line.trim().replace(newLinePrompts[self.type.language], '');
  }

  this.on('end', function(lines) {
    lines = lines.map(ansiToText).filter(function(line) { return line.trim(); });
    global.console.log('end:before', lines.slice(0));
    lines = lines.filter(isOutput).filter(function(line) { return line.trim() !== 'undefined'; }).map(removeNewLinePrompt);
    global.console.log('end:after', lines.slice(0));

    var firstLine = lines[0],
        lastLine = lines[lines.length - 1];

    if (lastLine && lastLine.trim().match(prompts[self.type.language])) {
      lines.pop();
    }

    if (self.currentCommand && (firstLine && firstLine.trim() === self.currentCommand.trim())) {
      lines.shift();
    }

    if (lines && lines.length > 0) {
      self.batch.push([self.currentCommand, lines]);
      // self.emit('endline', self.batch.slice(0));
      // global.console.log('end', self.batch.slice(0));
    }

    self.emit('endline', lines);
    // global.console.log('end', lines.slice(0));

    if (self.commands.length > 0) {
      // self.connection.removeEventListener('message', self.receiveCommandOutput);

      setTimeout(function() {
        self.sendCommandInput(self.commands.shift());
      }, 5);
      // self.batch.length = 0;
    }
    else {
      if (self.currentCommand === lines[lines.length - 1]) {
        self.passFilter = true;
      }

      // self.connection.addEventListener('message', self.receiveCommandOutput);
      // self.emit('endbatch', self.batch.slice(0));
      // self.batch.length = 0;
    }
  });
};

CodeBite.prototype.run = function(commands) {
  var self = this;
  self.passFilter = undefined;
  // global.console.log('run', global.document.activeElement);

  if (self.inContext) {
    var previousCommands = CodeBite.instances.slice(0, CodeBite.instances.indexOf(self)).filter(function(instance) {
      return instance.language === self.language;
    }).map(function(instance) {
      return instance.editor.getValue().trim().split('\n');
    });

    commands = flatten(previousCommands.concat(commands));
  }

  if (self.type.identifier !== 'devpad-nodejs') {
    // global.console.log(global.document.activeElement);
    $.post('https://' + CodeBite.baseURL.replace('/repl', '') + '/codebites/exec.json', { code: commands.join('\n'), type: self.type.identifier }).then(function(results) {
      self.emit('endbatch', results);
    }, console.error.bind(console));
    // global.console.log(global.document.activeElement);
  }
  else {
    self.sendCommandBatch(commands);
  }

  // self.editor.focus();
  this.emit('commandexecuted');
  // self.editor.focus();
};

CodeBite.prototype.applyHighlights = function applyHighlights() {
  var instance = this;

  if (instance.highlights.length > 0) {
    var doc = instance.editor.getDoc();

    doc.getAllMarks().forEach(function(mark) { mark.clear(); });

    instance.editor.display.wrapper.classList.add('shadowed');

    for (var i = 0; i < instance.highlights.length; i++) {
      var highlight = instance.highlights[i];

      doc.markText(highlight.start, highlight.end, { inclusiveLeft: true, inclusiveRight: true, className: 'codebite-highlight' });
    }
  }
  else {
    instance.editor.display.wrapper.classList.remove('shadowed');
  }
};

CodeBite.types = types;

module.exports = global.CodeBite = CodeBite;