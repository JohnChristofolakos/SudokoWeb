var React = require("react");

// component to render a single candidate
var GridCandidate = React.createClass({
  propTypes: {
    digit: React.PropTypes.number.isRequired
  },
  render: function() {
    var style = {
      top: Math.floor((this.props.digit - 1) / 3) * 16,
      left: ((this.props.digit - 1) % 3) * 16
    };
    return (
      <div className="gridCandidate" style={style}>
        {this.props.digit}
      </div>
    );
  }
});

// component to contains the candidates for a particular cell
var GridCandidatesLayer = React.createClass({
  propTypes: {
    candidates: React.PropTypes.arrayOf(React.PropTypes.number).isRequired
  },
  eachCandidate: function(digit) {
    return <GridCandidate digit={digit} key={digit}/>;
  },
  render: function() {
    return (
      <div className="gridCandidatesLayer">
        {this.props.candidates.map(this.eachCandidate)}
      </div>
    );
  }
});

// component to render the 'solved' value for a cell
var GridSolved = React.createClass({
  propTypes: {
    solution: React.PropTypes.number.isRequired
  },
  render: function() {
    return (
      <div className="gridSolved">{this.props.solution}</div>
    );
  }
});

// component to render cell background, and contain candidiates or the solved value
var GridCell = React.createClass({
  propTypes: {
    row: React.PropTypes.number.isRequired,
    col: React.PropTypes.number.isRequired
  },
  getInitialState: function() {
    return {
      candidates: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      solution: 0
    };
  },
  render: function() {
    var style = {
      top: this.props.row * 65,
      left: this.props.col * 65
    };
    var elem = this.state.solution != 0
        ? <GridSolved solution={this.state.solution} />
        : <GridCandidatesLayer candidates={this.state.candidates} />
    ;
    return (
      <div className="gridCell" style={style}>
        {elem}
      </div>
    );
  }
});

// component to render the grid background and contain the cell components
var GridFrame = React.createClass({
  render: function() {
    var cells = [];
    for (var row = 0; row < 9; row++) {
      for (var col = 0; col < 9; col++) {
        cells.push(<GridCell row={row} col={col} key={row * 9 + col}/>);
      }
    }
    return (
      <div className="gridFrame">{cells}</div>
    );
  }
});

var SudokuGrid = React.createClass({
  render: function() {
    return (
      <div><GridFrame /></div>
    );
  }
});

module.exports = SudokuGrid;