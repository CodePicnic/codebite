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
      self.startWSConnection();
      self.buildEvents();
      CodeBite.instances.push(self);
      self.emit('ready');
    });
  }
  else {
    var clientsPresent = (CodeBite.clientKey && CodeBite.clientSecret),
        auth = clientsPresent ? CodePicnic.initialize(CodeBite.clientKey, CodeBite.clientSecret) : CodePicnic.initialize(CodeBite.authToken);

    this.console = new CodePicnic.Console({ containerName: this.containerName, containerType: this.type.identifier, containerSize: 'medium', isHeadless: true, host: 'devpad' });
    this.startWSConnection();
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

CodeBite.prototype.run = function(commands) {
  var self = this;
  // global.console.log('run', commands);

  if (self.inContext) {
    var previousCommands = CodeBite.instances.slice(0, CodeBite.instances.indexOf(self)).filter(function(instance) {
      return instance.language === self.language;
    }).map(function(instance) {
      return instance.editor.getValue().trim().split('\n');
    });

    commands = flatten(previousCommands.concat(commands));
  }

  if (self.type.needsCompile) {
    var path = '/tmp/' + (Date.now().toString() + Math.ceil(Math.random() * Date.now())) + '.' + fileExtensions[self.language];

    self.console.uploadFile(path, new Blob([commands.join('\n')], { type: 'text/plain' })).then(function() {
      return self.console.exec(startCommands[self.language] + path);
    }).then(function(results) {
      var batch = [];

      Object.keys(results).forEach(function(command) {
        batch.push(['// Output:', [results[command]]]);
      });

      self.emit('endline', batch);
    }, console.error.bind(console));
  }
  else {
    self.sendCommandBatch(commands);
  }

  this.emit('commandexecuted');
};

CodeBite.prototype.buildEvents = function() {
  var self = this;

  function isntPromptOrOutput(line) {
    return !line.match(prompts[self.type.language]) || (outputPrompts[self.type.language] && line.match(outputPrompts[self.type.language]));
  }

  function removeNewLinePrompt(line) {
    return line.trim().replace(newLinePrompts[self.type.language], '');
  }

  this.on('end', function(lines, output) {
    lines = lines.map(ansiToText).filter(isntPromptOrOutput).map(removeNewLinePrompt);

    var firstLine = lines[0],
        lastLine = lines[lines.length - 1];

    if (lastLine && lastLine.trim().match(prompts[self.type.language])) {
      lines.pop();
    }

    if (firstLine && firstLine.trim() == self.currentCommand.trim()) {
      lines.shift();
    }

    self.batch.push([self.currentCommand, lines]);

    if (self.commands.length > 0) {
      self.emit('endline', [self.currentCommand, lines]);
      self.sendCommandInput(self.commands.shift());
    }
    else {
      self.emit('endline', [self.currentCommand, lines]);
      self.emit('endbatch', self.batch.slice(0));
      self.batch.length = 0;
    }
  });
};

CodeBite.types = types;

module.exports = global.CodeBite = CodeBite;