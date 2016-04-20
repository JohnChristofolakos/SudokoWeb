var sudokuConst = require("../constants/sudokuConst");

var ActionTypes = sudokuConst.sudokuActionTypes;

module.exports = {

  //////// grid content updates

  setPuzzle: function(puzzle) {
    this.dispatch(ActionTypes.SET_PUZZLE, {puzzle: puzzle});
  },

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

  //////// play controller updates

  selectDigit: function(digit) {
    this.dispatch(ActionTypes.HIGHLIGHT_DIGIT, {
      digit: digit
    });
  },

  selectCell: function(row, col) {
    this.dispatch(ActionTypes.SELECT_CELL, {
      row: row,
      col: col
    });
  },


  setEntryMode: function(mode) {
    this.dispatch(ActionTypes.SET_ENTRY_MODE, {
      mode: mode
    });
  },

  setDigitMode: function(mode) {
    this.dispatch(ActionTypes.SET_DIGIT_MODE, {
      mode: mode
    });
  }
};
