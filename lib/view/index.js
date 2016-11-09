/** @jsx preact.h */
var preact = require('preact'),
    throttle = require('lodash/throttle'),
    ms = require('ms'),
    Snippet = require('./snippet'),
    CodeEditor = require('./code_editor');

class CodeBiteView extends preact.Component {
  constructor(props) {
    super(props);

    this.state.status = 'loading';
    this.state.results = [];
    this.state.areResultsVisible = false;
    this.state.currentTime = Date.now();

    this.onClickPlayButton = throttle(function() {
      var instance = props.instance,
          commands = instance.editor.getValue().trim().split('\n');

      instance.run(commands);
    }, 500);
  }

  componentDidMount() {
    var self = this,
        instance = self.props.instance;

    setInterval(function() {
      self.setState({ currentTime: Date.now() });
    }, 10000);

    instance.on('connectioncreated', function() {
      instance.connection.addEventListener('open', function() {
        global.console.log('connection:open');
        self.setState({ status: 'ready' });
      });

      instance.connection.addEventListener('close', function disableRunButton() {
        self.setState({ status: 'loading' });
        instance.connection.removeEventListener('close', disableRunButton);
      });
    });

    instance.on('commandexecuted', function() {
      self.setState({ lastRunTime: Date.now() });
    });

    instance.on('endbatch', function(result) {
      self.setState({
        status: 'done',
        areResultsVisible: true,
        results: result.filter(function(block) { return block[0]; }),
        lastResultTime: Date.now()
      });
    });
  }

  toggleResults() {
    this.setState({ areResultsVisible: !this.state.areResultsVisible });
  }

  clearResults() {
    this.state.results.length = 0;
    this.setState({ results: this.state.results, status: 'replay' });
  }

  renderPlayButton() {
    if (this.state.status === 'done') {
      return <i className="icon icon-replay"></i>;
    }
    else if (this.state.status === 'loading') {
      return <i className="icon icon-loading"></i>;
    }
    else {
      return <i className="icon icon-run"></i>;
    }
  }

  renderPlayButtonText() {
    if (this.state.status === 'done' || this.state.status === 'loading') {
      return undefined;
    }
    else {
      return 'Run';
    }
  }

  renderMainButton() {
    return (
      <button ref={(playButton) => { this._playButton = playButton; }} type="button" className={'codebite-play ' + (this.state.status === 'loading' ? 'loading' : '') } disabled={this.state.status === 'loading'} onClick={this.onClickPlayButton.bind(this)}>
        {this.renderPlayButton()}
        {this.renderPlayButtonText()}
      </button>
    );
  }

  renderShareButton() {
    // return (
    //   <button type="button" className={'codebite-share'}>
    //     <i className="icon icon-share"></i>
    //     Share
    //   </button>
    // );
  }

  renderToggleResultsButton() {
    if (this.state.results.length > 0) {
      return (
        <button type="button" className="codebite-toggle-results" onClick={this.toggleResults.bind(this)}>
          <i className={'icon ' + (this.state.areResultsVisible ? 'icon-up' : 'icon-down')}></i>
          {this.state.areResultsVisible ? 'Collapse' : 'Expand'}
        </button>
      );
    }
  }

  renderResults(results) {
    var instance = this.props.instance;

    return results.map(function(block, index) {
      var output = block[1].join('\n').trim() ? <dd><Snippet code={block[1].join('\n')} mode={instance.type.mode} /></dd> : undefined;

      return (
        <dl key={index} className="CodeMirror cm-s-neo">
          <dt><Snippet code={block[0]} mode={instance.type.mode} /></dt>
          {output}
        </dl>
      );
    });
  }

  renderExecutionTime() {
    if (this.state.lastRunTime && this.state.lastResultTime) {
      if (this.state.lastRunTime <= this.state.lastResultTime) {
        var executionTime = ms(this.state.lastResultTime - this.state.lastRunTime, { 'long': true });

        return 'Took ' + executionTime + '. ';
      }
    }
  }

  renderLastExecutionTime() {
    if (this.state.lastRunTime) {
      if (this.state.currentTime > this.state.lastRunTime) {
        var lastExecutionTime = ms(this.state.currentTime - this.state.lastRunTime, { 'long': true });

        return 'Run ' + lastExecutionTime + ' ago';
      }
    }
  }

  render(props, state) {
    var instance = props.instance,
        resultsClassName;

    if (state.results.length > 0) {
      if (state.areResultsVisible) {
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
      <div ref={(wrapper) => { this._wrapper = wrapper; }}>
        <nav className="codebite-status logo">{props.name}</nav>
        <CodeEditor instance={instance} />
        <nav className="codebite-actions">
          {this.renderToggleResultsButton()}
          {this.renderMainButton()}
          {this.renderShareButton()}
        </nav>
        <div className={'codebite-result ' + resultsClassName}>
          {this.renderResults(state.results)}
          <nav className="codebite-results-actions">
            <span>
              {this.renderExecutionTime()}
              {this.renderLastExecutionTime()}
            </span>
            <span className="codebite-clear" onClick={this.clearResults.bind(this)}>Clear output<i className="icon icon-clear"></i></span>
          </nav>
        </div>
      </div>
    );
  }
}

module.exports = CodeBiteView;