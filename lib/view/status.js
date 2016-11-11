/** @jsx preact.h */
var preact = require('preact'),
    ms = require('ms');

class Status extends preact.Component {
  constructor(props) {
    super(props);

    this.state.currentTime = Date.now();
  }

  componentDidMount() {
    var that = this,
        instance = that.props.instance;

    this.timer = setInterval(function() {
      if (instance.lastRunTime) {
        that.setState({ currentTime: Date.now() });
      }
    }, 10000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  shouldComponentUpdate() {
    return (this.props.instance.lastRunTime && this.props.instance.lastResultTime);
  }

  renderExecutionTime() {
    var instance = this.props.instance;

    if (instance.lastRunTime && instance.lastResultTime) {
      if (instance.lastRunTime <= instance.lastResultTime) {
        var executionTime = ms(instance.lastResultTime - instance.lastRunTime, { 'long': true });

        return ('Took ' + executionTime + '. ');
      }
    }

    return '';
  }

  renderLastExecutionTime() {
    if (this.props.instance.lastRunTime) {
      if (this.state.currentTime > this.props.instance.lastRunTime && (this.state.currentTime - this.props.instance.lastRunTime > 1000)) {
        var lastExecutionTime = ms(this.state.currentTime - this.props.instance.lastRunTime, { 'long': true });

        return ('Run ' + lastExecutionTime + ' ago');
      }
    }

    return '';
  }

  render(props, state) {
    return <span>{this.renderExecutionTime() + this.renderLastExecutionTime()}</span>;
  }
}

module.exports = Status;