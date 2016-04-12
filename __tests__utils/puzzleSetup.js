var Puzzle = require("../public/scripts/model/puzzle.js");
var unitTypes = require("../public/scripts/constants/sudokuConst.js").sudokuUnitTypes;

var puzzleSetup = {
  setupWithNoBoxes: function(puzzle, rank) {
    var r, c, d;

    // add the cell constraints
    for (r = 0; r < rank; r++) {
      for (c = 0; c < rank; c++) {
        puzzle.addConstraint("p" + r + c, unitTypes.CELL,
          Puzzle.rowNames[r] + Puzzle.colNames[c])
      }
    }

    // add the row constraints
    for (r = 0; r < rank; r++) {
      for (var d = 1; d <= rank; d++) {
        puzzle.addConstraint("r" + r + d, unitTypes.ROW,
           Puzzle.rowNames[r]);
      }
    }
    
    // add the column constraints
    for (c = 0; c < rank; c++) {
      for (var d = 1; d <= rank; d++) {
        puzzle.addConstraint("c" + c + d, unitTypes.COLUMN,
           Puzzle.colNames[c]);
      }
    }

    // add the candidates
    for (r = 0; r < rank; r++) {
      for (c = 0; c < rank; c++) {
        for (d = 1; d <= rank; d++) {
          puzzle.addCandidate(
              ["p" + r + c, "r" + r + d, "c" + c + d],
              r, c, d);
        }
      }
    }
  },

  setupWithBoxes: function(puzzle, rank) {
    var r, c, b, d;

    // add the cell constraints
    for (r = 0; r < rank*rank; r++) {
      for (c = 0; c < rank*rank; c++) {
        puzzle.addConstraint("p" + r + c, unitTypes.CELL,
          Puzzle.rowNames[r] + Puzzle.colNames[c])
      }
    }

    // add the row constraints
    for (r = 0; r < rank*rank; r++) {
      for (var d = 1; d <= rank*rank; d++) {
        puzzle.addConstraint("r" + r + d, unitTypes.ROW,
           Puzzle.rowNames[r]);
      }
    }
    
    // add the column constraints
    for (c = 0; c < rank*rank; c++) {
      for (var d = 1; d <= rank*rank; d++) {
        puzzle.addConstraint("c" + c + d, unitTypes.COLUMN,
           Puzzle.colNames[c]);
      }
    }

    // add the box constraints
    for (b = 0; b < rank*rank; b++) {
      for (var d = 1; d <= rank*rank; d++) {
        puzzle.addConstraint("b" + b + d, unitTypes.BOX,
           Puzzle.boxNames[b]);
      }
    }

    // add the candidates
    for (r = 0; r < rank*rank; r++) {
      for (c = 0; c < rank*rank; c++) {
        for (d = 1; d <= rank*rank; d++) {
          var b = Math.floor(r / rank) * rank + Math.floor(c / rank);

          puzzle.addCandidate(
              ["p" + r + c, "r" + r + d, "c" + c + d, "b" + b + d],
              r, c, d);
        }
      }
    }
  }
};

module.exports = puzzleSetup;