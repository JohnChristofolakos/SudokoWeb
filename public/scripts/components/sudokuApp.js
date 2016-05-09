var React = require("react");
var Fluxxor = require("fluxxor");
var $ = require("jquery-browserify");

var SudokuAppBar = require("./sudokuAppBar.js");
var SudokuGrid = require("./sudokuGrid.js");
var SudokuPlayController = require("./sudokuPlayController.js");
var Puzzle = require("../model/puzzle.js");
var PuzzleReader = require("../io/puzzleReader.js");

function getLineReader(data) {
  return function() {
    return data;
  };
}

function candidateReaderEmpty() {
  return null;
}

var SudokuApp = React.createClass({
  propTypes: {
    flux: React.PropTypes.object.isRequired
  },

  mixins: [
    Fluxxor.FluxMixin(React)
  ],

  setupPuzzle: function(data) {
    // generate the puzzle from the downloaded data
    var puzzle = new Puzzle();
    var puzzleReader = new PuzzleReader(getLineReader(data), candidateReaderEmpty);
    puzzleReader.generate(puzzle);

    // and set it into the puzzle store
    this.getFlux().actions.setPuzzle(puzzle);
  },

  render: function() {
    console.log("Rendering SudokuApp");
    
    return (
      <div className="sudokuApp">
          <SudokuAppBar onLoadPuzzle={this.onLoadPuzzle} />
          <SudokuGrid onCellClicked={this.onCellClicked} />
          <SudokuPlayController ref="playController" />
      </div>
    );
  },

  onCellClicked: function(row, col) {
    this.refs.playController.onCellClicked(row, col);
  },

  onLoadPuzzle: function() {
    console.log("Loading puzzle...");

    $.ajax({
      url: "/api/puzzle",
      datatype: "text",
      cache: false,
      success: function(data) {
        this.setupPuzzle(data);
      }.bind(this),
      error: function(xhr, status, err) {
        console.error("/api/puzzle", status, err.toString());
      }.bind(this)
    });
  }

});

module.exports = SudokuApp;