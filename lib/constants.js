var prompts = {
      ruby: /^irb(.*)(>|\*)(\s?)$/,
      javascript: /^>(\s?)$/,
      php: /^php(\s?)>(\s?)$/,
      python: /^>>>(\s?)$/,
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
      nodejs: {
        language: 'javascript',
        mode: 'text/javascript',
        identifier: 'nodejs',
        name: 'NodeJS (5.6.0)',
        // image: 'codepicnic/base_20151201'
      },
      php: {
        language: 'php',
        mode: 'text/x-php',
        identifier: 'php',
        name: 'PHP (5.5.9)',
        // image: 'codepicnic/php_20160107'
      },
      php7: {
        language: 'php',
        mode: 'text/x-php',
        identifier: 'php7',
        name: 'PHP (7.0.2)',
        // image: 'codepicnic/php7_20160112'
      },
      python: {
        language: 'python',
        mode: 'text/x-python',
        identifier: 'python',
        name: 'Python (2.7.6)',
        // image: 'codepicnic/base_20151201'
      },
      python350: {
        language: 'python',
        mode: 'text/x-python',
        identifier: 'python350',
        name: 'Python (3.5.0)',
        // image: 'codepicnic/python350_20160305'
      },
      'devpad-ruby23': {
        language: 'ruby',
        mode: 'text/x-ruby',
        identifier: 'devpad-ruby23',
        name: 'Ruby (2.3)',
        // image: 'devpad/ruby23'
      },
      'devpad-go142': {
        language: 'go',
        mode: 'text/x-go',
        identifier: 'devpad-go142',
        name: 'Go 1.4.2',
        // image: 'devpad/golang',
        needsCompile: true
      }
    },
    baseImages = {
      ruby: 'sha256:5cb9bbe6288519cc7d2d211a2023c9544179e734d076633c3adf755165ae3c26',
      php: 'sha256:a4c3088af8c8cd3b1d16f862d51d25bfbe355660608a25b2508e8d320a2c7a35'
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