/** @jsx preact.h */
var preact = require('preact'),
    throttle = require('lodash/throttle'),
    CodeEditor = require('./code_editor'),
    Snippet = require('./snippet'),
    Status = require('./status');

class CodeBiteView extends preact.Component {
  constructor(props) {
    super(props);

    this.state.status = 'loading';
    this.state.results = [];
    this.state.areResultsVisible = false;

    this.onClickPlayButton = throttle(function() {
      var instance = props.instance,
          commands = instance.editor.getValue().trim().split('\n');

      instance.run(commands);
    }, 500);
  }

  componentDidMount() {
    var self = this,
        instance = self.props.instance;

    instance.on('connection:created', function() {
      instance.connection.addEventListener('open', function() {
        self.setState({ status: 'ready' });
      });

      instance.connection.addEventListener('close', function disableRunButton() {
        self.setState({ status: 'loading' });
        instance.connection.removeEventListener('close', disableRunButton);
      });
    });

    instance.on('commandexecuted', function() {
      instance.lastRunTime = Date.now();
      self.clearResults();
    });

    instance.on('endline', function(lineResult) {
      var results = self.state.results.slice(0);
      results = results.concat(lineResult.filter(function(block) { return block[0]; }));

      global.console.log('endline', results);

      if (instance.commands.length === 0) {
        instance.lastResultTime = Date.now();
      }

      self.setState({
        status: instance.commands.length === 0 ? 'done' : 'loading',
        areResultsVisible: true,
        results: results
      });
    });

    instance.on('endbatch', function(results) {
      instance.lastResultTime = Date.now();

      global.console.log('endbatch', results);

      self.setState({
        status: 'done',
        areResultsVisible: true,
        results: results//.filter(function(block) { return block[0]; })
      });
    });
  }

  toggleResults() {
    this.setState({ areResultsVisible: !this.state.areResultsVisible });
  }

  clearResults() {
    this.props.instance.batch.length = 0;
    this.state.results.length = 0;
    this.setState({ results: this.state.results, status: 'replay' });
  }

  renderPlayButton() {
    var className = 'icon ';

    if (this.state.status === 'done') {
      className += 'icon-replay';
    }
    else if (this.state.status === 'loading') {
      className += 'icon-loading';
    }
    else {
      className += 'icon-run';
    }

    return <i className={className}></i>;
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

    // global.console.log('results', results);

    return results.map(function(block, index) {
      return <dd key={index}><Snippet code={block} mode={instance.type.mode} /></dd>;
      // if (typeof block === 'string') {
      //   return <dt key={index}><Snippet code={block} mode={instance.type.mode} /></dt>;
      // }
      // else {
      //   return <dd key={index}><Snippet code={block[0]} mode={instance.type.mode} /></dd>;
      // }

      // if (block[1].length > 0) {
      //   var output = <dd><Snippet code={block[1][0]} mode={instance.type.mode} /></dd>;

      //   return (
      //     <dl key={index} className="CodeMirror cm-s-neo">
      //       <dt><Snippet code={block[0]} mode={instance.type.mode} /></dt>
      //       {output}
      //     </dl>
      //   );
      // }
      // else {
      //   return <dd key={index}><Snippet code={block[0]} mode={instance.type.mode} /></dd>;
      // }
    });
  }

  render(props, state) {
    var instance = props.instance,
        resultsClassName;

    if (state.areResultsVisible) {
      resultsClassName = 'visible';
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
          <dl className="CodeMirror cm-s-neo">
            {this.renderResults(state.results)}
          </dl>
          <nav className="codebite-results-actions">
            <Status instance={instance} />
            <span className="codebite-clear" onClick={this.clearResults.bind(this)}>Clear output<i className="icon icon-clear"></i></span>
          </nav>
        </div>
      </div>
    );
  }
}

module.exports = CodeBiteView;