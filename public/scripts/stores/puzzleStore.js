var Fluxxor = require("fluxxor");
var { Map } = require("immutable");

var { sudokuActionTypes } = require("../constants/sudokuConst.js");

var PuzzleStore = Fluxxor.createStore({
  initialize: function() {
    this.puzzle = null;
    this.candidates = Map();
    this.solution = Map();
    this.hints = Map();
    this.cellRowSelected = 0;
    this.cellColSelected = 0;
    this.digitSelected = 0;

    this.bindActions(
      sudokuActionTypes.SET_PUZZLE, this.onSetPuzzle,
      sudokuActionTypes.REMOVE_CANDIDATE, this.onRemoveCandidate,
      sudokuActionTypes.RESTORE_CANDIDATE, this.onRestoreCandidate,
      sudokuActionTypes.SOLVE_CELL, this.onSolveCell,
      sudokuActionTypes.UNSOLVE, this.onUnsolve,

      sudokuActionTypes.SELECT_CELL, this.onSelectCell,
      sudokuActionTypes.UNSELECT_CELL, this.onUnselectCell,
      sudokuActionTypes.SELECT_DIGIT, this.onSelectDigit,
      sudokuActionTypes.UNSELECT_DIGIT, this.onUnselectDigit
    );
  },

  getState: function() {
    return {
      candidates: this.candidates,
      solution: this.solution,
      hints: this.hints,
      cellRowSelected: this.cellRowSelected,
      cellColSelected: this.cellColSelected,
      digitSelected: this.digitSelected
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

    this.emit("change");
  },

  onUnsolve: function() {
    var hit = this.puzzle.unsolve();

    this.solution = this.solution.delete(hit.getCandidate().getName());

    this.candidates = Map(this.puzzle.getActiveCandidates()
        .map(c => { return [ c.getName(), c ]; } ));

    this.emit("change");
  },

  onSelectCell: function(payload) {
    this.cellRowSelected = payload.cellRowSelected;
    this.cellColSelected = payload.cellColSelected;

    this.emit("change");
  },

  onUnselectCell: function() {
    this.cellRowSelected = 0;
    this.cellColSelected = 0;

    this.emit("change");
  },

  onSelectDigit: function(payload) {
    this.digitSelected = payload.didgt;

    this.emit("change");
  },

  onUnselectDigit: function() {
    this.digitSelected = 0;

    this.emit("change");
  }

});

module.exports = PuzzleStore;