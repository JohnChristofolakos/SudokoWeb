var dispatcher = require("../dispatcher/sudokuDispatcher");
var sudokuConst = require("../constants/sudokuConst");

var ActionTypes = sudokuConst.sudokuActionTypes;

module.exports = {

  addCandidate: function(candidate) {
    dispatcher.dispatch({
      type: ActionTypes.ADD_CANDIDATE,
      candidate: candidate
    });
  },

  removeCandidate: function(candidate) {
    dispatcher.dispatch({
      type: ActionTypes.REMOVE_CANDIDATE,
      candidate: candidate
    });
  },

  addHint: function(candidate) {
    dispatcher.dispatch({
      type: ActionTypes.ADD_HINT,
      candidate: candidate
    });
  },

  addSolution: function(candidate) {
    dispatcher.dispatch({
      type: ActionTypes.ADD_SOLUTION,
      candidate: candidate
    });
  },

  removeSolution: function(candidate) {
    dispatcher.dispatch({
      type: ActionTypes.REMOVE_SOLUTION,
      candidate: candidate
    });
  },

  highlightCell: function(row, col) {
    dispatcher.dispatch({
      type: ActionTypes.HIGHLIGHT_CELL,
      row: row,
      col: col
    });
  },

  highlightCandidate: function(candidate) {
    dispatcher.dispatch({
      type: ActionTypes.HIGHLIGHT_CANDIDATE,
      candidate: candidate
    });
  }
};
