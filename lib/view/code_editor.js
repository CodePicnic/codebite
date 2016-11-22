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
      theme: 'neo',
      mode: instance.type.mode,
      lineWrapping: true,
      lineNumbers: true,
      indentUnit: 2,
      tabSize: 2,
      indentWithTabs: false,
      viewportMargin: Infinity,
      extraKeys: {
        'Tab': function(editor) {
          var spaces = Array(editor.getOption("indentUnit") + 1).join(" ");
          editor.replaceSelection(spaces);
        },
        'Shift-Enter': function(editor) {
          var commands = editor.getValue().trim().split('\n');

          instance.run(commands);
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
  }

  shouldComponentUpdate() {
    return false;
  }

  render() {
    return <div ref={(editor) => { this._editor = editor; }}></div>
  }
}

module.exports = CodeEditor;