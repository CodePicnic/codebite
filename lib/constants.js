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
      dp_nodejs: {
        language: 'javascript',
        mode: 'text/javascript',
        identifier: 'dp_nodejs',
        name: 'NodeJS (6.7.0)'
      },
      dp_php: {
        language: 'php',
        mode: 'text/x-php',
        identifier: 'dp_php',
        name: 'PHP (5.6)'
      },
      // php7: {
      //   language: 'php',
      //   mode: 'text/x-php',
      //   identifier: 'php7',
      //   name: 'PHP (7.0.2)'
      // },
      dp_python: {
        language: 'python',
        mode: 'text/x-python',
        identifier: 'dp_python',
        name: 'Python (2.7)'
      },
      // python350: {
      //   language: 'python',
      //   mode: 'text/x-python',
      //   identifier: 'python350',
      //   name: 'Python (3.5.0)'
      // },
      dp_ruby: {
        language: 'ruby',
        mode: 'text/x-ruby',
        identifier: 'dp_ruby',
        name: 'Ruby (2.3.1)'
      },
      dp_go: {
        language: 'go',
        mode: 'text/x-go',
        identifier: 'dp_go',
        name: 'Go 1.7.1',
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