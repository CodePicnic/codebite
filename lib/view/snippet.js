/** @jsx preact.h */
var preact = require('preact');

class Snippet extends preact.Component {
  componentDidMount() {
    global.CodeMirror.runMode(this.props.code || '', this.props.mode, this._code);
  }

  componentDidUpdate() {
    global.CodeMirror.runMode(this.props.code || '', this.props.mode, this._code);
  }

  render(props) {
    return <pre ref={(code) => { this._code = code; }}>{props.code}</pre>;
  }
}

module.exports = Snippet;