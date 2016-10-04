var React = require('react'),
    Snippet;

Snippet = React.createClass({
  componentDidMount: function() {
    global.CodeMirror.runMode(this.props.code, this.props.mode, this.refs.code);
  },
  render: function() {
    return <pre ref="code">{this.props.code}</pre>;
  }
});

module.exports = Snippet;