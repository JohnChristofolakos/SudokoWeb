var Fluxxor = require("fluxxor");
var keyMirror = require("keymirror");

var { sudokuActionTypes } = require("../constants/sudokuConst.js");

var EntryMode = keyMirror({
  NONE: null,
  CELL_SELECTED: null,
  DIGIT_SELECTED: null
});

var DigitMode = keyMirror({
  BIG_NUMBER: null,
  CANDIDATE: null,
  CLEAR: null
});

var PlayControllerStore = Fluxxor.createStore({
  initialize: function() {
    this.clearState();

    this.bindActions(
      sudokuActionTypes.SET_PUZZLE, this.onSetPuzzle,
      sudokuActionTypes.REMOVE_CANDIDATE, this.onPuzzleUpdate,
      sudokuActionTypes.RESTORE_CANDIDATE, this.onPuzzleUpdate,
      sudokuActionTypes.SOLVE_CELL, this.onPuzzleUpdate,
      sudokuActionTypes.UNSOLVE, this.onPuzzleUpdate,

      sudokuActionTypes.SELECT_CELL, this.onSelectCell,
      sudokuActionTypes.UNSELECT_CELL, this.onUnselectCell,
      sudokuActionTypes.SELECT_DIGIT, this.onSelectDigit,
      sudokuActionTypes.UNSELECT_DIGIT, this.onUnselectDigit,
      sudokuActionTypes.SET_DIGIT_MODE, this.onSetDigitMode,
      sudokuActionTypes.TOGGLE_CANDIDATE, this.onPuzzleUpdate,
      sudokuActionTypes.ADD_SOLUTION, this.onPuzzleUpdate,
      sudokuActionTypes.CLEAR_CELL, this.onPuzzleUpdate
    );
  },

  clearState: function() {
    this.digitSelected = 0;
    this.cellRowSelected = -1;
    this.cellColSelected = -1;
    this.entryMode = EntryMode.NONE;
    this.digitMode = DigitMode.BIG_NUMBER;
    this.digitsEnabled = [];
  },

  getState: function() {
    return {
      digitSelected: this.digitSelected,
      cellRowSelected: this.cellRowSelected,
      cellColSelected: this.cellColSelected,
      entryMode: this.entryMode,
      digitMode: this.digitMode,
      digitsEnabled: this.digitsEnabled
    };
  },

  setFlux: function(flux) {
    this.flux = flux;
  },

  setDigitsEnabled: function() {
    if (this.entryMode === EntryMode.CELL_SELECTED) {
      // only enable digits that could be candidates in this cell
      this.digitsEnabled = this.flux.store("PuzzleStore")
        .getPossibleCandidates(this.cellRowSelected, this.cellColSelected);
    }
    else {
      // only enable digits that have not been completely solved yet
      this.digitsEnabled = this.flux.store("PuzzleStore")
        .getUnsolvedCandidates();
    }
  },

  onSetPuzzle: function() {
    this.waitFor(["PuzzleStore"], function() {

      this.clearState();
      this.setDigitsEnabled();

      this.emit("change");
    });
  },

  onSelectCell: function(payload) {
    this.cellRowSelected = payload.row;
    this.cellColSelected = payload.col;
    this.entryMode = EntryMode.CELL_SELECTED;
    this.setDigitsEnabled();

    this.emit("change");
  },

  onUnselectCell: function() {
    this.cellRowSelected = -1;
    this.cellColSelected = -1;
    this.entryMode = EntryMode.NONE;
    this.setDigitsEnabled();

    this.emit("change");
  },

  onSelectDigit: function(payload) {
    this.digitSelected = payload.digit;
    this.entryMode = EntryMode.DIGIT_SELECTED;
    
    this.emit("change");
  },

  onUnselectDigit: function() {
    this.digitSelected = 0;
    this.entryMode = EntryMode.NONE;
    
    this.emit("change");
  },

  onSetDigitMode: function(payload) {
    this.digitMode = payload.digitMode;
    this.setDigitsEnabled();

    this.emit("change");
  },

  onPuzzleUpdate: function() {
    this.waitFor(["PuzzleStore"], function() {
      this.setDigitsEnabled();

      this.emit("change");
    });
  }
});

module.exports = {
  PlayControllerStore : PlayControllerStore,
  EntryMode: EntryMode,
  DigitMode: DigitMode
};