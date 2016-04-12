var React = require("react");
var Fluxxor = require("fluxxor");

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

// component to contain the candidates for a particular cell
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

// component to render the 'solved' value for a cell
var GridHinted = React.createClass({
  propTypes: {
    hint: React.PropTypes.number.isRequired
  },
  render: function() {
    return (
      <div className="gridHinted">{this.props.hint}</div>
    );
  }
});

// component to render cell background, and contain candidiates or the solved value
var GridCell = React.createClass({
  propTypes: {
    row: React.PropTypes.number.isRequired,
    col: React.PropTypes.number.isRequired,
    candidates: React.PropTypes.arrayOf(React.PropTypes.number).isRequired,
    solution: React.PropTypes.number.isRequired,
    hint: React.PropTypes.number.isRequired
  },
  render: function() {
    var style = {
      top: this.props.row * 65,
      left: this.props.col * 65
    };
    var elem = this.props.solution != 0
        ? <GridSolved solution={this.props.solution} />
        : (this.props.hint != 0
          ? <GridHinted hint={this.props.hint} />
          : <GridCandidatesLayer candidates={this.props.candidates} />
          )
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
  propTypes: {
    candidates: React.PropTypes.object.isRequired,
    solution: React.PropTypes.object.isRequired,
    hints: React.PropTypes.object.isRequired
  },
  render: function() {
    var cellProps = [];
    for (var row = 0; row < 9; row++) {
      cellProps.push([]);
      for (var col = 0; col < 9; col++) {
        cellProps[row].push({
          candidates: [],
          solution: 0,
          hint: 0
        });
      }
    }

    this.props.candidates.forEach( (c) => {
      cellProps[c.getRow()][c.getCol()].candidates.push(c.getDigit());
    });

    this.props.solution.forEach( (c) => {
      cellProps[c.getRow()][c.getCol()].solution = c.getDigit();
    });

    this.props.hints.forEach( (c) => {
      cellProps[c.getRow()][c.getCol()].hint = c.getDigit();
    });

    var cells = [];
    for (row = 0; row < 9; row++) {
      for (col = 0; col < 9; col++) {
        cells.push(
          <GridCell
            row={row}
            col={col}
            key={row * 9 + col}
            candidates={cellProps[row][col].candidates}
            solution={cellProps[row][col].solution}
            hint={cellProps[row][col].hint}
            />);
      }
    }
    return (
      <div className="gridFrame">{cells}</div>
    );
  }
});

var SudokuGrid = React.createClass({
  mixins: [
    Fluxxor.FluxMixin(React),
    Fluxxor.StoreWatchMixin("PuzzleStore")
  ],

  getInitialState: function() {
    return {
    };
  },

  getStateFromFlux: function() {
    var flux = this.getFlux();
    return flux.store("PuzzleStore").getState();    
  },

  render: function() {
    return (
      <div>
        <GridFrame
          candidates={this.state.candidates}
          solution={this.state.solution}
          hints={this.state.hints}
        />
      </div>
    );
  }
});

module.exports = SudokuGrid;