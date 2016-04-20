var keyMirror = require("keymirror");

var sudokuActionTypes = keyMirror({
  // grid content updates
  SET_PUZZLE: null,
  REMOVE_CANDIDATE: null,
  RESTORE_CANDIDATE: null,
  SOLVE_CELL: null,
  UNSOLVE: null,
  REMOVE_SOLUTION: null,
  
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

module.exports = {

  sudokuActionTypes: sudokuActionTypes,

  sudokuUnitTypes: sudokuUnitTypes,

  sudokuUnitNames: sudokuUnitNames

};