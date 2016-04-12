var Fluxxor = require("fluxxor");
var { List, Map } = require("immutable");

var { sudokuActionTypes } = require("../constants/sudokuConst.js");

var PuzzleStore = Fluxxor.createStore({
  initialize: function() {
    this.puzzle = null;
    this.candidates = Map();
    this.solution = Map();
    this.hints = Map();

    this.bindActions(
      sudokuActionTypes.SET_PUZZLE, this.onSetPuzzle,
      sudokuActionTypes.REMOVE_CANDIDATE, this.onRemoveCandidate,
      sudokuActionTypes.RESTORE_CANDIDATE, this.onRestoreCandidate,
      sudokuActionTypes.SOLVE_CELL, this.onSolveCell,
      sudokuActionTypes.UNSOLVE, this.onUnsolve,
      sudokuActionTypes.HIGHLIGHT_CELL, this.onHighlightCell,
      sudokuActionTypes.HIGHLIGHT_CANDIDATE, this.onHighlightCandidate
    );
  },

  getState: function() {
    return {
      candidates: this.candidates,
      solution: this.solution,
      hints: this.hints
    };
  },

  onSetPuzzle: function(payload) {
    this.puzzle = payload.puzzle;

    this.candidates = Map(this.puzzle.getActiveCandidates()
        .map(c => { return [ c.getName(), c ]; } ));

    this.solution = Map(this.puzzle.getSolution()
        .map(h => { return [ h.getCandidate().getName(), h.getCandidate() ]; } ));

    this.hints = Map(this.puzzle.getHints()
        .map(c => { return [ c.getName(), c ]; } ));

    this.emit("change");
  },

  onRemoveCandidate: function(payload) {
    this.puzzle.eliminateCandidate(payload.hit);

    this.candidates = this.candidates.delete(payload.hit.getCandidate().getName());

    this.emit("change");
  },

  onRestoreCandidate: function(payload) {
    this.puzzle.restoreCandidate(payload.hit);

    this.candidates = this.candidates.set(
        payload.hit.getCandidate().getName(),
        payload.hit.getCandidate()
    );

    this.emit("change");
  },

  onSolveCell: function(payload) {
    this.puzzle.solve(payload.hit);

    this.solution = this.solution.set(
        payload.hit.getCandidate().getName(),
        payload.hit.getCandidate()
    );

    this.candidates = Map(this.puzzle.getActiveCandidates()
        .map(c => { return [ c.getName(), c ]; } ));
  },

  onUnsolve: function() {
    var hit = this.puzzle.unsolve();

    this.solution = this.solution.delete(hit.getCandidate().getName());

    this.candidates = Map(this.puzzle.getActiveCandidates()
        .map(c => { return [ c.getName(), c ]; } ));
  },

  onHighlightCell: function(payload) {
      // TODO
  },

  onHighlightCandidate: function(payload) {
      // TODO
  }
});

module.exports = PuzzleStore;