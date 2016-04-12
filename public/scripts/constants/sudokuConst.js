var keyMirror = require("keymirror");

var sudokuActionTypes = keyMirror({
  SET_PUZZLE: null,
  REMOVE_CANDIDATE: null,
  RESTORE_CANDIDATE: null,
  SOLVE_CELL: null,
  UNSOLVE: null,
  REMOVE_SOLUTION: null,
  HIGHLIGHT_CELL: null,
  HIGHLIGHT_CANDIDATE: null
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