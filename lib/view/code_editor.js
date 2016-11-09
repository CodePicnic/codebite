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
      viewportMargin: Infinity,
      extraKeys: {
        'Shift-Enter': function(editor) {
          var commands = editor.getValue().trim().split('\n');

          instance.run(commands);
        }
      }
    });

    instance.editor.on('change', function(editor) {
      instance.content = editor.getValue();
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