var React = require("react");
var ReactDOM = require("react-dom");
var SudokuApp = require("./components/sudokuApp");
var Fluxxor = require("fluxxor");

var Puzzle = require("./model/puzzle.js");
var PuzzleStore = require("./stores/puzzleStore.js");
var sudokuActions = require("./actions/sudokuActions.js");
var PuzzleReader = require("./io/puzzleReader.js");

window.React = React;

// setup flux
var stores = {
  PuzzleStore: new PuzzleStore()
};

var flux = new Fluxxor.Flux(stores, sudokuActions);
window.flux = flux;
flux.on("dispatch", function(type, payload) {
  if (console && console.log) {
    console.log("[Dispatch]", type, payload);
  }
});

// build the puzzle
function lineReader(rowNum) {
  var lines = [
    "2...41..6",
    "4..6.2.1.",
    ".16.9...4",
    "3..12964.",
    "142.6.59.",
    ".695.4..1",
    "584216379",
    "92.4.8165",
    "6.19..482"
  ];

  return lines[rowNum];
}

function candidateReaderEmpty() {
  return null;
}

var puzzle = new Puzzle();
var puzzleReader = new PuzzleReader(lineReader, candidateReaderEmpty);
puzzleReader.generate(puzzle);

// and set it into the puzzle store
flux.actions.setPuzzle(puzzle);

// render the app
if (console && console.log) {
  console.log("Rendering app");
}
ReactDOM.render(
  <SudokuApp flux={flux}/>,
  document.getElementById("sudokuApp")
);
