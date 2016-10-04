var React = require('react'),
    throttle = require('lodash/throttle'),
    Snippet = require('./snippet'),
    CodeBiteView;

CodeBiteView = React.createClass({
  getInitialState: function() {
    return { status: 'loading', results: [], areResultsVisible: false };
  },
  componentDidMount:  function() {
    var instance = this.props.instance,
        editor = this.refs.editor;

    instance.editor = global.CodeMirror(function(element) {
      editor.parentNode.replaceChild(element, editor);
    }, {
      value: instance.content,
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
  },
  onClickPlayButton: throttle(function() {
    var instance = this.props.instance,
        commands = instance.editor.getValue().trim().split('\n');

    instance.run(commands);
  }, 500),
  toggleResults: function() {
    this.setState({ areResultsVisible: !this.state.areResultsVisible });
  },
  renderPlayButton: function() {
    if (this.state.status === 'done') {
      return <i className="icon icon-replay"></i>;
    }
    else if (this.state.status === 'loading') {
      return <i className="icon icon-loading"></i>;
    }
    else {
      return <i className="icon icon-run"></i>;
    }
  },
  renderPlayButtonText: function() {
    if (this.state.status === 'done' || this.state.status === 'loading') {
      return undefined;
    }
    else {
      return 'Run';
    }
  },
  renderMainButton: function() {
    return (
      <button type="button" className={'codebite-play ' + (this.state.status === 'loading' ? 'loading' : '') } disabled={this.state.status === 'loading'} onClick={this.onClickPlayButton}>
        {this.renderPlayButton()}
        {this.renderPlayButtonText()}
      </button>
    );
  },
  renderToggleResultsButton: function() {
    if (this.state.results.length > 0) {
      return (
        <button type="button" className="codebite-toggle-results" onClick={this.toggleResults}>
          <i className={'icon ' + (this.state.areResultsVisible ? 'icon-up' : 'icon-down')}></i>
          {this.state.areResultsVisible ? 'Collapse' : 'Expand'}
        </button>
      );
    }
  },
  renderResults: function(results) {
    var instance = this.props.instance;

    return results.map(function(block, index) {
      var output = block[1].join('\n').trim() ? <dd><Snippet code={block[1].join('\n')} mode={instance.type.mode} /></dd> : undefined;

      return (
        <dl key={index}>
          <dt><Snippet code={block[0]} mode={instance.type.mode} /></dt>
          {output}
        </dl>
      );
    });
  },
  render: function() {
    var instance = this.instance,
        resultsClassName;

    if (this.state.results.length > 0) {
      if (this.state.areResultsVisible) {
        resultsClassName = 'visible';
      }
      else {
        resultsClassName = '';
      }
    }
    else {
      resultsClassName = '';
    }

    return (
      <div ref="wrapper">
        <nav className="codebite-status logo">{this.props.name}</nav>
        <div ref="editor"></div>
        <nav className="codebite-actions">
          {this.renderToggleResultsButton()}
          {this.renderMainButton()}
          <button type="button" className={'codebite-share'}>
            <i className="icon icon-share"></i>
            Share
          </button>
        </nav>
        <div className={'CodeMirror cm-s-neo codebite-result ' + resultsClassName}>
          {this.renderResults(this.state.results)}
        </div>
      </div>
    );
  }
});

module.exports = CodeBiteView;