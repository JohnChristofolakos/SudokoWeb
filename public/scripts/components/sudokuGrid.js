var React = require("react");
var Fluxxor = require("fluxxor");
var classNames = require("classnames");

var viewConst = require("../constants/sudokuConst.js").sudokuViewConst;
var { EntryMode, DigitMode } = require("../stores/playControllerStore.js");

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
    hint: React.PropTypes.number.isRequired,
    isHighlighted: React.PropTypes.bool.isRequired,
    isSelected: React.PropTypes.bool.isRequired,
    isSelectedCandidate: React.PropTypes.bool.isRequired,
    isDisabled:  React.PropTypes.bool.isRequired,
    onCellClicked: React.PropTypes.func.isRequired
  },

  mixins: [
    Fluxxor.FluxMixin(React)
  ],

  render: function() {
    var cellClass = classNames({
      gridCell: true,
      gridCellHighlighted: this.props.isHighlighted,
      gridCellSelected: this.props.isSelected,
      gridCellSelectedCandidate: this.props.isSelectedCandidate,
      gridCellDisabled: this.props.isDisabled
    });

    var style = {
      top: this.props.row * (viewConst.GRID_CELL_SIZE + viewConst.GRID_CELL_SPACING) +
           Math.floor(this.props.row / 3) * viewConst.GRID_UNIT_SPACING,
      left: this.props.col * (viewConst.GRID_CELL_SIZE + viewConst.GRID_CELL_SPACING) +
           Math.floor(this.props.col / 3) * viewConst.GRID_UNIT_SPACING,
      width: viewConst.GRID_CELL_SIZE,
      height: viewConst.GRID_CELL_SIZE
    };

    var elem = this.props.solution != 0
        ? <GridSolved solution={this.props.solution} />
        : (this.props.hint != 0
          ? <GridHinted hint={this.props.hint} />
          : <GridCandidatesLayer candidates={this.props.candidates} />
          )
    ;

    return (
      <div className={cellClass} style={style}
          onClick={this.onCellClicked}>
        {elem}
      </div>
    );
  },

  onCellClicked: function() {
    console.log("Cell clicked, row: " + this.props.row + ", col: " + this.props.col);
    this.props.onCellClicked(this.props.row, this.props.col);
  }
});

// component to render the grid background and contain the cell components
var GridFrame = React.createClass({
  propTypes: {
    candidates: React.PropTypes.object.isRequired,
    solution: React.PropTypes.object.isRequired,
    hints: React.PropTypes.object.isRequired,
    cellRowSelected: React.PropTypes.number.isRequired,
    cellColSelected: React.PropTypes.number.isRequired,
    digitMode: React.PropTypes.string.isRequired,
    digitSelected: React.PropTypes.number.isRequired,
    onCellClicked: React.PropTypes.func.isRequired
  },

  mixins: [
    Fluxxor.FluxMixin(React)
  ],

  render: function() {
    var cellProps = [];
    for (var row = 0; row < 9; row++) {
      cellProps.push([]);
      for (var col = 0; col < 9; col++) {
        cellProps[row].push({
          candidates: [],
          solution: 0,
          hint: 0,
          isHighlighted: false,
          isSelected: (row === this.props.cellRowSelected) &&
                      (col === this.props.cellColSelected) &&
                      (this.props.digitMode === DigitMode.BIG_NUMBER),
          isSelectedCandidate: (row === this.props.cellRowSelected) &&
                               (col === this.props.cellColSelected) &&
                               (this.props.digitMode === DigitMode.CANDIDATE),
          isDisabled: false
        });
      }
    }

    this.props.candidates.forEach(c => {
      cellProps[c.getRow()][c.getCol()].candidates.push(c.getDigit());
      if (c.getDigit() === this.props.digitSelected) {
        cellProps[c.getRow(), c.getCol()].isHighlighted = true;
      }
    });

    this.props.solution.forEach(c => {
      cellProps[c.getRow()][c.getCol()].solution = c.getDigit();
      if (c.getDigit() === this.props.digitSelected) {
        cellProps[c.getRow(), c.getCol()].isHighlighted = true;
      }
      if (c.getRow() === this.props.cellRowSelected &&
          c.getCol() === this.props.cellColSelected &&
          this.props.digitMode === DigitMode.CANDIDATE) {
        cellProps[c.getRow(), c.getCol()].isSelected = false;
        cellProps[c.getRow(), c.getCol()].isSelectedCandidate = false;
        cellProps[c.getRow(), c.getCol()].isDisabled = true;
      }
    });

    this.props.hints.forEach(c => {
      cellProps[c.getRow()][c.getCol()].hint = c.getDigit();
      if (c.getDigit() === this.props.digitSelected) {
        cellProps[c.getRow(), c.getCol()].isHighlighted = true;
      }
      if (c.getRow() === this.props.cellRowSelected &&
          c.getCol() === this.props.cellColSelected) {
        cellProps[c.getRow(), c.getCol()].isSelected = false;
        cellProps[c.getRow(), c.getCol()].isSelectedCandidate = false;
        cellProps[c.getRow(), c.getCol()].isDisabled = true;
      }
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
            isHighlighted={cellProps[row][col].isHighlighted}
            isSelected={cellProps[row][col].isSelected}
            isSelectedCandidate={cellProps[row][col].isSelectedCandidate}
            isDisabled={cellProps[row][col].isDisabled}
            onCellClicked={this.props.onCellClicked}
          />);
      }
    }

    var style = {
      width: viewConst.GRID_SIZE(),
      height: viewConst.GRID_SIZE()
    };

    return (
      <div className="gridFrame" style={style}>
        {cells}
      </div>
    );
  }
});

var SudokuGrid = React.createClass({
  propTypes: {
    onCellClicked: React.PropTypes.func.isRequired
  },

  mixins: [
    Fluxxor.FluxMixin(React),
    Fluxxor.StoreWatchMixin("PuzzleStore", "PlayControllerStore")
  ],

  getInitialState: function() {
    return {
    };
  },

  getStateFromFlux: function() {
    var flux = this.getFlux();
    return {
      puzzle: flux.store("PuzzleStore").getState(),
      playController: flux.store("PlayControllerStore").getState()
    };
  },

  render: function() {
    console.log("Rendering sudokuGrid");

    var cellRowSelected = -1, cellColSelected = -1;
    if (this.state.playController.entryMode === EntryMode.CELL_SELECTED) {
      cellRowSelected = this.state.playController.cellRowSelected;
      cellColSelected = this.state.playController.cellColSelected;
    }
    return (
      <GridFrame
        candidates={this.state.puzzle.candidates}
        solution={this.state.puzzle.solution}
        hints={this.state.puzzle.hints}
        cellRowSelected={cellRowSelected}
        cellColSelected={cellColSelected}
        digitMode={this.state.playController.digitMode}
        digitSelected={this.state.playController.digitSelected}
        onCellClicked={this.props.onCellClicked}
      />
    );
  }
});

module.exports = SudokuGrid;