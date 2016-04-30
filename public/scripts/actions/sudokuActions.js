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

  // to be used for backtracking/undo only - otherwise use toggleCandidate
  restoreCandidate: function(hit) {
    this.dispatch(ActionTypes.RESTORE_CANDIDATE, {hit: hit});
  },

  solveCell: function(hit) {
    this.dispatch(ActionTypes.SOLVE_CELL, {hit: hit});
  },

  unsolve: function() {
    this.dispatch(ActionTypes.UNSOLVE, {});
  },

  toggleCandidate: function(row, col,  digit) {
    this.dispatch(ActionTypes.TOGGLE_CANDIDATE, {
      row: row,
      col: col,
      digit: digit
    });
  },

  addSolution: function(row, col, digit) {
    this.dispatch(ActionTypes.ADD_SOLUTION, {
      row: row,
      col: col,
      digit: digit
    });
  },

  clearCell: function(row, col) {
    this.dispatch(ActionTypes.CLEAR_CELL, { row: row, col: col });
  },

  puzzleUndo: function() {
    this.dispatch(ActionTypes.PUZZLE_UNDO, {});
  },

  puzzleRedo: function() {
    this.dispatch(ActionTypes.PUZZLE_REDO, {});
  },

  //////// play controller updates

  selectDigit: function(digit) {
    this.dispatch(ActionTypes.SELECT_DIGIT, {
      digit: digit
    });
  },

  unselectDigit: function() {
    this.dispatch(ActionTypes.UNSELECT_DIGIT, {});
  },

  selectCell: function(row, col) {
    this.dispatch(ActionTypes.SELECT_CELL, {
      row: row,
      col: col
    });
  },

  unselectCell: function() {
    this.dispatch(ActionTypes.UNSELECT_CELL, {});
  },

  setEntryMode: function(entryMode) {
    this.dispatch(ActionTypes.SET_ENTRY_MODE, {entryMode: entryMode});
  },

  setDigitMode: function(digitMode) {
    this.dispatch(ActionTypes.SET_DIGIT_MODE, {digitMode: digitMode});
  }

};
