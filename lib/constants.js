var prompts = {
      ruby: /^irb(.*)(>|\*)(\s?)$/,
      javascript: /^>(\s?)$|^\.{3,}(\s*)/,
      php: /^php(\s?)>(\s?)$/,
      python: /^>>>(\s?)|^\.{3,}(\s*)$/,
      go: /^\/(.*)\s#(\s?)$/
    },
    newLinePrompts = {
      ruby: /^irb(.*)(>|\*) /,
      javascript: /^> /,
      php: /^php(\s?)> $/,
      python: /^>>> $/,
      go: /^\/(.*)\s#(\s?)$/
    },
    outputPrompts = {
      ruby: /^=>/,
      php: /^(?!php(\s?)>)/,
      python: /^(?!>>>(\s?))/,
      go: /^(?!\/(.*)\s#)/
    },
    types = {
      'devpad-nodejs': {
        language: 'javascript',
        mode: 'text/javascript',
        identifier: 'devpad-nodejs',
        name: 'NodeJS (6.7.0)'
      },
      'devpad-php': {
        language: 'php',
        mode: 'text/x-php',
        identifier: 'devpad-php',
        name: 'PHP (5.6)'
      },
      'devpad-python': {
        language: 'python',
        mode: 'text/x-python',
        identifier: 'devpad-python',
        name: 'Python (2.7)'
      },
      'devpad-ruby': {
        language: 'ruby',
        mode: 'text/x-ruby',
        identifier: 'devpad-ruby',
        name: 'Ruby (2.3.1)'
      },
      'devpad-golang': {
        language: 'go',
        mode: 'text/x-go',
        identifier: 'devpad-golang',
        name: 'Go 1.7.1',
        needsCompile: true
      }
    },
    startCommands = {
      ruby: 'irb\n',
      php: 'php -dcli.prompt="\nphp> " -a\n',
      javascript: 'node\n',
      python: 'python -i\n',
      go: 'go run '
    },
    fileExtensions = {
      go: 'go',
      csharp: 'cs'
    };

module.exports = {
  prompts: prompts,
  newLinePrompts: newLinePrompts,
  outputPrompts: prompts,
  startCommands: startCommands,
  fileExtensions: fileExtensions,
  types: types
};