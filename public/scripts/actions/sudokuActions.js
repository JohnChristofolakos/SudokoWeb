var sudokuConst = require("../constants/sudokuConst");

var ActionTypes = sudokuConst.sudokuActionTypes;

module.exports = {

  // these first three used only during puzzle setup

  setPuzzle: function(puzzle) {
    this.dispatch(ActionTypes.SET_PUZZLE, {puzzle: puzzle});
  },

  // the remainder are used during play/solving

  removeCandidate: function(hit) {
    this.dispatch(ActionTypes.REMOVE_CANDIDATE, {hit: hit});
  },

  restoreCandidate: function(hit) {
    this.dispatch(ActionTypes.RESTORE_CANDIDATE, {hit: hit});
  },

  solveCell: function(hit) {
    this.dispatch(ActionTypes.SOLVE_CELL, {hit: hit});
  },

  unsolve: function() {
    this.dispatch(ActionTypes.UNSOLVE, {});
  },

  removeSolution: function(hit) {
    this.dispatch(ActionTypes.REMOVE_SOLUTION, {hit: hit});
  },

  highlightCell: function(row, col, color) {
    this.dispatch(ActionTypes.HIGHLIGHT_CELL, {
      row: row,
      col: col,
      color: color
    });
  },

  highlightCandidate: function(candidate, color) {
    this.dispatch(ActionTypes.HIGHLIGHT_CANDIDATE, {
      candidate: candidate,
      color: color
    });
  }
};
