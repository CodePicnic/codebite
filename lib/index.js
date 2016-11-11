var EventEmitter = require('events').EventEmitter,
    CodePicnic = require('codepicnic'),
    preact = require('preact'),
    CodeBiteView = require('./view/index'),
    ansi = require('ansi_up'),
    ansiToText = ansi.ansi_to_text,
    extend = require('lodash/extend'),
    flatten = require('lodash/flatten'),
    CommandSender = require('./commandSender'),
    types = require('./constants').types,
    startCommands = require('./constants').startCommands,
    fileExtensions = require('./constants').fileExtensions,
    prompts = require('./constants').prompts,
    newLinePrompts = require('./constants').newLinePrompts,
    outputPrompts = require('./constants').outputPrompts;

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
  this.messages = [];
  this.receiveCommandOutput = this.receiveCommandOutput.bind(this);

  this.buildContainer();

  this.viewProps = {
    instance: this,
    name: this.type.name
  };

  // this.view = ReactDOM.render(React.createElement(CodeBiteView, { instance: this, name: this.type.name }), this.element);
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
    this.startWSConnection();
    this.buildEvents();
    CodeBite.instances.push(this);

    setTimeout(function() {
      self.emit('ready');
    }, 10);
  }
}

CodeBite.baseURL = 'codepicnic.com/repl';
CodeBite.instances = [];
CodeBite.prototype = extend(CodeBite.prototype, EventEmitter.prototype, CommandSender);

CodeBite.prototype.startWSConnection = function() {
  var connectionProtocol = (global.location.protocol === 'https:' ? 'wss:' : 'ws:'),
      baseURL = connectionProtocol + '//' + CodeBite.baseURL + '/',
      self = this;

  this.connection = new WebSocket(baseURL + this.containerName + '?token=' + CodeBite.authToken);
  this.emit('connection:created');
  this.connection.addEventListener('open', function enableRunButton() {
    self.connection.send(startCommands[self.language]);
    self.connection.removeEventListener('open', enableRunButton);
  });

  this.connection.addEventListener('close', function() {
    setTimeout(this.startWSConnection.bind(this), 500);
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
      });
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

      self.emit('endbatch', batch);
    }, console.error.bind(console));
  }
  else {
    self.sendCommandBatch(commands);
  }

  this.emit('commandexecuted');
};

CodeBite.prototype.buildEvents = function() {
  var self = this,
      isntPromptOrOutput = function(line) {
        return !line.match(prompts[self.type.language]) || (outputPrompts[self.type.language] && line.match(outputPrompts[self.type.language]));
      },
      removeNewLinePrompt = function(line) {
        return line.trim().replace(newLinePrompts[self.type.language], '');
      };

  this.on('end', function(lines, message) {
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
      self.sendCommandInput(self.commands.shift());
    }
    else {
      self.emit('endbatch', self.batch.slice(0));
      self.batch.length = 0;
    }
  });
};

CodeBite.types = types;

module.exports = global.CodeBite = CodeBite;