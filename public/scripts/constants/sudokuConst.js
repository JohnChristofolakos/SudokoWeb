var keyMirror = require("keymirror");

var sudokuActionTypes = keyMirror({
  // grid content updates
  SET_PUZZLE: null,
  TOGGLE_CANDIDATE: null,
  ADD_SOLUTION: null,
  CLEAR_CELL: null,
  PUZZLE_UNDO: null,
  PUZZLE_REDO: null,
  
  // play controller updates
  SELECT_CELL: null,
  UNSELECT_CELL: null,
  SELECT_DIGIT: null,
  UNSELECT_DIGIT: null,
  SET_ENTRY_MODE: null,
  SET_DIGIT_MODE: null
});

var sudokuUnitTypes = keyMirror({
  ROOT: null,
  CELL: null,
  ROW: null,
  COLUMN: null,
  BOX: null
});

var sudokuUnitNames = {};
sudokuUnitNames[sudokuUnitTypes.ROOT] = 
  { name: "root",
    namePlural: "roots"
  };
sudokuUnitNames[sudokuUnitTypes.CELL] =
  { name: "cell",
    namePlural: "cells"
  };
sudokuUnitNames[sudokuUnitTypes.ROW] =
  { name: "row",
    namePlural: "rows"
  };
sudokuUnitNames[sudokuUnitTypes.COLUMN] =
  { name: "column",
    namePlural: "columns"
  };
sudokuUnitNames[sudokuUnitTypes.BOX] =
  { name: "box",
    namePlural: "boxes"
  };

var sudokuViewConst = {
  GRID_CELL_SIZE: 60,
  GRID_CELL_SPACING: 8,
  GRID_UNIT_SPACING: 5,
  GRID_SIZE: function() {
    return (sudokuViewConst.GRID_CELL_SIZE * 9) +
           (sudokuViewConst.GRID_CELL_SPACING * 8) +
           (sudokuViewConst.GRID_UNIT_SPACING * 2);
  }
};

module.exports = {
  sudokuActionTypes: sudokuActionTypes,
  sudokuUnitTypes: sudokuUnitTypes,
  sudokuUnitNames: sudokuUnitNames,
  sudokuViewConst: sudokuViewConst
};