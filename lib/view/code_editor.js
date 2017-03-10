/** @jsx preact.h */
var preact = require('preact');

class CodeEditor extends preact.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    var self = this,
        instance = self.props.instance,
        _editor = self._editor;

    instance.editor = global.CodeMirror(function(element) {
      _editor.parentNode.replaceChild(element, _editor);
    }, {
      value: instance.content || '',
      placeholder: 'Press Ctrl + Enter to run this snippet',
      theme: 'neo',
      mode: instance.type.mode,
      lineWrapping: true,
      lineNumbers: true,
      indentUnit: 2,
      tabSize: 2,
      indentWithTabs: false,
      viewportMargin: Infinity,
      autofocus: instance.shouldFocus,
      extraKeys: {
        'Tab': function(editor) {
          var spaces = Array(editor.getOption("indentUnit") + 1).join(" ");
          editor.replaceSelection(spaces);
        },
        'Ctrl-Enter': function(editor) {
          instance.shouldFocus = true;
          var commands = editor.getValue().trim().split('\n');

          instance.run(commands);
          editor.focus();
        },
        'Cmd-Enter': function(editor) {
          instance.shouldFocus = true;
          var commands = editor.getValue().trim().split('\n');

          instance.run(commands);
          editor.focus();
        }
      }
    });

    instance.editor.on('focus', function() {
      instance.emit('editor:focus');
    });

    instance.editor.on('blur', function() {
      instance.emit('editor:blur');
    });

    instance.editor.on('change', function(editor) {
      instance.content = editor.getValue();
    });

    instance.editor.on('change', function(editor) {
      instance.emit('editor:change');
    });

    instance.applyHighlights();
  }

  shouldComponentUpdate() {
    return false;
  }

  render() {
    return (
      <div>
        <div ref={(editor) => { this._editor = editor; }}></div>
      </div>
    );
  }
}

module.exports = CodeEditor;