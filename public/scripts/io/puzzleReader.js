var sudokuUnitTypes = require("../constants/sudokuConst.js").sudokuUnitTypes;
var Puzzle = require("../model/puzzle.js");

// Class that reads a Sudoku description and initializes
// a new Puzzle.
//
// The constructor takes two parameters:
//
// - a getRow() function which should retrive the next row of
// puzzle hints. It will be passed a 0-based row number as a
// convenience for array-based getters.
//
// - an optional getCandidate() function which should return
// the name of a candidate to be eliminated from the puzzle each
// time it is called, or null if no more candidates are to be
// eliminated. This can be used to setup a precise position,
// for example to test a logical solving strategy. Again, it will
// passed a 0-based candidate number for the convenience of
// array-based getters.
//
// If the first row read contains 81 characters, then it is taken to
// contain the entire diagram. Otherwise, rows should contain 9
// characters - either a digit if the cell is a hint, or a '.' to
// indicate a cell to be solved.
//

// creates a 2d array with the given dimensions
function createArray(x, y) {
  return Array.apply(null, Array(x)).map(e => (e, Array(y)));
}

var PuzzleReader = function(getRow, getCandidate) {
  if (!(this instanceof PuzzleReader)) {
    return new PuzzleReader(getRow, getCandidate);
  }
  if (arguments.length !== 1 && arguments.length !== 2) {
    throw new Error("PuzzleReader(): wrong number of arguments: " + arguments.length);
  }

  this.getRow = getRow;
  this.getCandidate = getCandidate;

  // things to cover - 1 of each digit in each unit, digit '0' is wasted
  this.row = createArray(9, 10);
  this.col = createArray(9, 10);
  this.box = createArray(9, 10);

  // positions already filled
  this.board = createArray(9, 9);
};

// Parses a line into the arrays above, checking for conflicts
PuzzleReader.prototype.parseLine = function(r, line) {
  if (line.length != 9)
    throw new Error("Input line should have 9 characters exactly!");

  for (var c = 0; c < 9; c++) {
    if (line.charAt(c) !== ".") {
      if (line.charAt(c) < "1" || line.charAt(c) > "9")
        throw new Error("Illegal character '" + line.charAt(c) +
            "' in input line " + r + "!");

      var d = parseInt(line.charAt(c));
      if (this.row[r][d])
        throw new Error("Two identical digits " + d + " in row " + r + "!");
      this.row[r][d] = true;

      if (this.col[c][d])
        throw new Error("Two identical digits " + d + " in column " + c + "!");
      this.col[c][d] = true;

      var b = Math.floor(r/3) * 3 + Math.floor(c/3);
      if (this.box[b][d])
        throw new Error("Two identical digits " + d + " in  box " + b + "!");
      this.box[b][d] = true;

      this.board[r][c] = d;
    }
  }
};

// Populates the diagram with the fixed set of column names corresponding to a
// (standard) Sudoku diagram
PuzzleReader.prototype.generateConstraints = function(puzzle) {
  // create the cell constraints first
  for (var r = 0; r < 9; r++) {
    for (var c = 0; c < 9; c++) {
      puzzle.addConstraint("p" + r + c, sudokuUnitTypes.CELL,
          Puzzle.rowNames[r] + Puzzle.colNames[c]);
    }
  }
  
  // we need three separate nested loops in order to ensure all of the
  // row constraints precede the column constraints, which precede the
  // box constraints. So when we add the candidates below, we can ensure
  // candidate hits are added to the row in ascending constraint number
  // order. Routines like candidate#sharedHits depend on this ordering.
  for (r = 0; r < 9; r++) {
    for (var d = 1; d <= 9; d++) {
      puzzle.addConstraint("r" + r + d, sudokuUnitTypes.ROW, Puzzle.rowNames[r]);
    }
  }
  for (c = 0; c < 9; c++) {
    for (d = 1; d <= 9; d++) {
      puzzle.addConstraint("c" + c + d, sudokuUnitTypes.COLUMN, Puzzle.colNames[c]);
    }
  }
  for (var b = 0; b < 9; b++) {
    for (d = 1; d <= 9; d++) {
      puzzle.addConstraint("b" + b + d, sudokuUnitTypes.BOX, Puzzle.boxNames[b]);
    }
  }
};

// Populates the diagram with the candidates corresponding to the specified
// cell: generates the candidate name, and the list of constraints hit by
// the candidate
PuzzleReader.prototype.generateCandidates = function(puzzle, r, c) {
  // calculate the box number for this (r,c)
  var b = Math.floor(r/3) * 3 + Math.floor(c/3);
  
  // loop through the possible digits
  for (var d = 1; d <= 9; d++) {
    // create the row corresponding to placing digit d into this cell
    var hits = [];
    
    // fill the list in the same order as the columns were created above
    hits.push("p" + r + c);    // fills the cell at (r,c)
    hits.push("r" + r + d);    // hits digit d in row r
    hits.push("c" + c + d);    // hits digit d in column c
    hits.push("b" + b + d);    // hits digit d in box x 
    
    // add the row to the diagram
    puzzle.addCandidate(hits, r, c, d);
  }
};

// Reads the input - may be either 9 lines of 9 chars each, or a single
// line of 81 chars
PuzzleReader.prototype.read = function() {
  var line = this.getRow(0);
  if (!line)
    throw new Error("Input is empty!");

  if (line.length === 81) {
    for (var r = 0; r < 9; r++) {
      this.parseLine(r, line.substr(r * 9,  9));
    }
  }
  else {
    this.parseLine(0, line);

    for (r = 1; r < 9; r++) {
      line = this.getRow(r);
      if (!line)
        throw new Error("Not enough rows in the input!");
      
      this.parseLine(r, line);
    }
  }
};

// Generate the puzzle. In this implementation, we generate a
// 'blank' diagram first, then add the hints.
PuzzleReader.prototype.generate = function(puzzle) {
  // read in the hints
  this.read();

  // populate the constraint names
  this.generateConstraints(puzzle);

  // populate the candidates for each cell
  for (var r = 0; r < 9; r++) {
    for (var c = 0; c < 9; c++) {
      this.generateCandidates(puzzle, r, c);
    }
  }

  // add the hinted cells to the puzzle - this will cause the
  // corresponding constraints to be 'covered'
  for (c = 0; c < 9; c++) {
    for (r = 0; r < 9; r++) {
      if (this.board[r][c])
        puzzle.addHint("r" + r + "c" + c + "d" + this.board[r][c]);
    }
  }

  // see if we have any candidates to eliminate
  var name;
  var i = 0;
  while ((name = this.getCandidate(i++)) != null) {
    var candidate = puzzle.findCandidate(name);
    if (candidate) {
      puzzle.eliminateCandidate(candidate.getFirstHit());
    }
  }
};

module.exports = PuzzleReader;