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
  CANDIDATE: null
});

var PlayControllerStore = Fluxxor.createStore({
  initialize: function() {
    this.clearState();

    this.bindActions(
      sudokuActionTypes.SET_PUZZLE, this.onSetPuzzle,
 
      sudokuActionTypes.SELECT_CELL, this.onSelectCell,
      sudokuActionTypes.UNSELECT_CELL, this.onUnselectCell,
      sudokuActionTypes.SELECT_DIGIT, this.onSelectDigit,
      sudokuActionTypes.UNSELECT_DIGIT, this.onUnselectDigit,
      sudokuActionTypes.SET_DIGIT_MODE, this.onSetDigitMode
    );
  },

  clearState: function() {
    this.digitSelected = 0;
    this.cellRowSelected = 0;
    this.cellColSelected = 0;
    this.entryMode = EntryMode.NONE;
    this.digitMode = DigitMode.BIG_NUMBER;
  },

  getState: function() {
    return {
      digitSelected: this.digitSelected,
      cellRowSelected: this.cellRowSelected,
      cellColSelected: this.cellColSelected,
      entryMode: this.entryMode,
      digitMode: this.digitMode
    };
  },

  onSetPuzzle: function() {
    this.clearState();

    this.emit("change");
  },

  onSelectCell: function(payload) {
    this.cellRowSelected = payload.row;
    this.cellColSelected = payload.col;
    this.entryMode = EntryMode.CELL_SELECTED;

    this.emit("change");
  },

  onUnselectCell: function() {
    this.cellRowSelected = 0;
    this.cellColSelected = 0;
    this.entryMode = EntryMode.NONE;
    
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
    this.digitMode = payload.mode;

    this.emit("change");
  }

});

module.exports = {
  PlayControllerStore : PlayControllerStore,
  EntryMode: EntryMode,
  DigitMode: DigitMode
};