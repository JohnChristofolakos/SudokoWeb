var Hit = require("./hit.js");
var Candidate = require("./candidate.js");
var Constraint = require("./constraint.js");
var UnitTypes = require("../constants/sudokuConst.js").sudokuUnitTypes;
var SudokuActions = require("../actions/sudokuActions.js");

// Returns an object representing a Sudoku problem in set cover form.
// After Donald E. Knuth, see
// http://www-cs-faculty.stanford.edu/~uno/programs/dance.w.
//
// Each column of the input matrix is represented by a Constraint instance,
// and each row is represented as a Candidate instances. There's one
// node, represented as a Hit instance, for each nonzero entry in the matrix.
//
// The Hits are linked circularly within each Candidate, in both directions.
// The Hits are also linked circularly within each Constraint; the Constraint
// lists each include a header Hit, but the Candidiate lists do not.
//
// As backtracking proceeds downwards, nodes will be deleted from column lists
// when their row has been blocked by other rows in the partial solution.
// But when backtracking upwards, the data structures will be restored to their
// original state.
//
// One Constraint instance is called the root. It serves as the head of the
// list of constraints that need to be covered, and is identifiable by the fact
// that its name is null.
//
// To initialise this class, call addConstraint)() for each column in the matrix,
// then call addCandidate() for each row. Depending on the usage, the client can
// add all possible rows and columns, then specify a number of 'solved' rows by
// calling addHint(). Or the hinted cells can be accounted for during the
// initial construction of the diagram, as the original Knuth algorithm does.
//
var Puzzle = function() {
  // safety
  if (!(this instanceof Puzzle)) {
    return new Puzzle();
  }
  if (arguments.length !== 0) {
    throw new Error("Puzzle(): wrong number of arguments: " + arguments.length);
  }

  // One Constraint instance is called the root. It serves as the head of the
  // list of Constraints that need to be covered, and is identifiable by the fact
  // that its name is empty. The 'live' Constraints and Hits are those reachable
  // from the root
  this._rootConstraint = new Constraint(new Hit(), null, UnitTypes.ROOT, null);
  this._constraintCount = 0;

  // There is also a root Candidate, so that we can traverse all Candidates,
  // needed for some logical strategies
  this._rootCandidate = new Candidate(0, 0, 0, "root");
  this._candidateCount = 0;
  
  // These are the Candidates 'given' as hints.
  this._hints = [];
  
  // The row and column chosen on each level as a (possibly tentative) solution,
  // the elements are instances of Hit.
  this._solution = [];
};

/////////////// getters

// Returns the root constraint
Puzzle.prototype.getRootConstraint = function() {
  return this._rootConstraint;
};

// Returns the count of active constraints
Puzzle.prototype.getConstraintCount = function() {
  return this._constraintCount;
};

// Returns the root candidate of the diagram 
Puzzle.prototype.getRootCandidate = function() {
  return this._rootCandidate;
};

// Returns the count of active rows
Puzzle.prototype.getCandidateCount = function() {
  return this._candidateCount;
};

// Returns true if the diagram is clearly unsolvable from this position.
Puzzle.prototype.isBlocked = function() {
  for (var c of this.getActiveConstraints()) {
    if (c.getLength() == 0) {
      return true;
    }
  }
  return false;
};

// Returns true if the puzzle is solved.
Puzzle.prototype.isSolved = function() {
  return this._constraintCount == 0;
};

// Returns a copy of the list of candidates that were initially
// given as hints for the puzzle.
Puzzle.prototype.getHints = function() {
  return this._hints.slice(0);
};

// Returns a copy of the list of candidates that are in
// the current solution
Puzzle.prototype.getSolution = function() {
  return this._solution.slice(0);
};

// Returns a list of the currently active candidates
Puzzle.prototype.getActiveCandidates = function() {
  var list = [];

  var c = this.getRootCandidate().getNext();
  while (c !== this.getRootCandidate()) {
    list.push(c);
    c = c.getNext();
  }

  return list;
};

// Returns a list of the currently active (not yet covered) constraints.
// If lenFilter is specified, then only those constraints having the
// specfified length are retuned.
Puzzle.prototype.getActiveConstraints = function(lenFilter) {
  var list = [];
  
  for (var c = this.getRootConstraint().getNext();
      c !== this.getRootConstraint();
      c = c.getNext()) {
    if (lenFilter === undefined || c.getLength() == lenFilter) {
      list.push(c);
    }
  }
  return list;
};

// Returns the constraint with the given name, or undefined.
Puzzle.prototype.findConstraint = function(name) {
  for (var c = this.getRootConstraint().getNext();
           c !== this.getRootConstraint();
           c = c.getNext()) {
    if (c.getName() === name) {
      return c;
    }
  }
  return undefined;
};

// Returns the candidate with the given name, or undefined.
Puzzle.prototype.findCandidate = function(name) {
  for (var c = this.getRootCandidate().getNext();
           c !== this.getRootCandidate();
           c = c.getNext()) {
    if (c.getName() === name) {
      return c;
    }
  }
  return undefined;
};

////////////////// private for use by the mutating routines below

// Unlinks this candidate from the candidates list, and notifies the dispatcher
Puzzle.prototype._unlinkCandidate = function(c) {
  if (c.constructor !== Candidate) {
    throw new Error("Puzzle.unlinkCandidate: parameter should be Candidate");
  }

  c.unlinkFromCandidateList();
  this._candidateCount--;

  // notify the dispatcher
  SudokuActions.removeCandidate(c);
};

// Relinks this candidate into the candidates list, and notifies the dispatcher
Puzzle.prototype._relinkCandidate = function(c) {
  if (c.constructor !== Candidate) {
    throw new Error("Puzzle.unlinkCandidate: parameter should be Candidate");
  }

  c.relinkIntoCandidateList();
  this._candidateCount++;

  // notify the dispatcher
  SudokuActions.addCandidate(c);
};

/////////////// mutating routines used during solving - all are reversible

// When a candidate is blocked, it leaves all lists except the list of the
// constraint that is being covered. Thus a hit is never removed from a list
// twice.
//
// Returns number of hit updates performed
Puzzle.prototype.cover = function(level, constraint) {
  if (constraint.constructor !== Constraint) {
    throw new Error("Puzzle.cover: parameter should be Constraint");
  }
  var k = 1;
  
  // unlink the constraint from the constraint list
  constraint.unlinkFromConstraintList();
  this._constraintCount--;
  
  // Remove all candidates that have a hit against this constraint,
  // one of them at a time will be tried as part of the solution set,
  // the others will conflict
  for (var c = constraint.getHead().getDown();
       c != constraint.getHead();
       c = c.getDown()) {
    for (var h = c.getRight(); h !== c; h = h.getRight()) {
      // unlink the hit from its constraint, and bump the update count
      h.getConstraint().unlinkHit(h);
      k++;
    }
    
    // remove the candidate from the candidates list
    this._unlinkCandidate(c.getCandidate());
  }
  return k;
};

// "Uncovering is done in precisely the reverse order. The pointers thereby
// execute an exquisitely choreographed dance which returns them almost
// magically to their former state."  - D. Knuth
Puzzle.prototype.uncover = function(constraint) {
  if (constraint.constructor !== Constraint) {
    throw new Error("Puzzle.uncover: parameter should be Constraint");
  }
  for (var c = constraint.getHead().getUp();
       c != constraint.getHead();
       c = c.getUp()) {
    for (var h = c.getLeft(); h != c; h = h.getLeft()) {
      h.getConstraint().relinkHit(h);
    }
    
    // add the candidate back into the candidates list
    this._relinkCandidate(c.getCandidate());
  }

  // link the constraint back into the constraint list
  constraint.relinkIntoConstraintList();
  this._constraintCount++;
};

// Covers all the constraints covered by this hit's candidate, excepting
// the constraint covered by this hit itself.
Puzzle.prototype.coverHitConstraints = function(level, hit) {
  if (hit.constructor !== Hit) {
    throw new Error("Puzzle.coverHitConstraints: parameter should be Hit");
  }
  for (var h = hit.getRight(); h != hit; h = h.getRight()) {
    this.cover(level, h.getConstraint());
  }
};

// "We included left links, thereby making the rows doubly linked, so
// that constraints would be uncovered in the correct LIFO order in this
// part of the program. (The uncover routine itself could have done its
// job with right links only.) (Think about it.)"  - D.Knuth
Puzzle.prototype.uncoverHitConstraints = function(hit) {
  if (hit.constructor !== Hit) {
    throw new Error("Puzzle.uncoverHitConstraints: parameter should be Hit");
  }
  for (var h = hit.getLeft(); h != hit; h = h.getLeft()) {
    this.uncover(h.getConstraint());
  }
};

// Removes a candidate that has been eliminated by the logical
// solver or by the user. The parameter is any hit in the
// candidate's hit list. Returns the number of hit updates.
//
// TODO refactor to take the candidate as parameter
//
Puzzle.prototype.eliminateCandidate = function(hit) {
  if (hit.constructor !== Hit) {
    throw new Error("Puzzle.eliminateCandidate: parameter should be Hit");
  }

  // unlink the candidate's hits from their constraints
  var rr = hit;
  var k = 0;
  do {
    rr.getConstraint().unlinkHit(rr);
    rr = rr.getRight();
    k++;
  } while (rr != hit);
  
  // unlink the candidate from the candidates list
  this._unlinkCandidate(hit.getCandidate());
  
  return k;
};

// Restores a candidate that was eliminated by the logical solver
// or by a human solver. Returns the number of hit updates performed.
//
// Needed if the logical solver is alternated with the backtracking
// solver, in order to find chains, and to support undo.
//
// TODO refactor to take the candidate as parameter
//
Puzzle.prototype.restoreCandidate = function(hit) {
  if (hit.constructor !== Hit) {
    throw new Error("Puzzle.restoreCandidate: parameter should be Hit");
  }

  // link the candidate's hits back into their constraint lists
  var rr = hit;
  var k = 0;
  do {
    rr.getConstraint().relinkHit(rr);
    rr = rr.getLeft();
    k++;
  } while (rr != hit); 
  
  // link the candidate back into the candidates list
  this._relinkCandidate(rr.getCandidate());
  
  return k;
};

// Pushes a candidate onto the solution list (possibly tentatively), and
// notifies the dispatcher
Puzzle.prototype.pushSolution = function(hit) {
  if (hit.constructor !== Hit) {
    throw new Error("Puzzle.pushSolution: parameter should be Hit");
  }

  this._solution.push(hit);

  // notify the dispatcher
  SudokuActions.addSolution(hit.getCandidate());
};

// Pops the last candidate off the solution list (during backtracking/undo)
// and notifies the dispatcher
Puzzle.prototype.popSolution = function() {
  var hit = this._solution.pop();

  // notify the dispatcher
  SudokuActions.removeSolution(hit.getCandidate());

  return hit;
};

// convenience method to wrap cover, coverNodeColumns and pushSolution
Puzzle.prototype.solve = function(level, hit) {
  if (hit.constructor !== Hit) {
    throw new Error("Puzzle.solve: parameter should be Hit");
  }

  this.cover(level, hit.getConstraint());
  this.coverHitConstraints(level, hit);
  this.pushSolution(hit);
};

// convenience method to wrap popSolution, uncoverNodeColumns and uncover
Puzzle.prototype.unsolve = function() {
  var hit = this.popSolution();
  this.uncoverHitConstraints(hit);
  this.uncover(hit.getConstraint());
  return hit;
};

//////////////// initial diagram setup

/// Adds a constraint to the puzzle, returns the new Constraint instance.
Puzzle.prototype.addConstraint = function(name, unitType, unitName) {
  // create the head of the hits list
  var head = new Hit();

  // create the constraint
  var c = new Constraint(head, name, unitType, unitName);

  // link it into the columns list and bump the constraint count
  c.addToConstraintList(this.getRootConstraint());
  this._constraintCount++;

  return c;
};

// Adds a candidate to the puzzle during initial setup, returns the
// new candidate instance.
Puzzle.prototype.addCandidate = function(name, constraintNames,
          row, col, digit) {
  if (constraintNames === undefined || constraintNames === null) {
    throw new Error("constraintNames parameter may not be null");
  }
  if (constraintNames.length == 0) {
    throw new Error("constraintNames parameter may not be empty");
  }

  // create the candidate
  var candidate = new Candidate(row, col, digit,
        digit + "@" + Puzzle.rowNames[row] + Puzzle.colNames[col]);

  // link the new candidate into the candidates list
  candidate.addToCandidateList(this._rootCandidate);
  this._candidateCount++;
  

  for (var s of constraintNames) {
    // find the constraint with the specified name
    var constraint = this.findConstraint(s);
    if (constraint === undefined) {
      throw new Error("Unknown constraint name '" + s + "'");
    }
    
    // add a hit for this candidate against this constraint
    var h = new Hit();
    
    // add the hit to the candidate's list
    candidate.addHit(h);

    // add the hit to the constraint's list
    constraint.addHit(h);
  }
  
  if (candidate.getFirstHit() == null) {
    throw new Error("Empty candidate");
  }

  // notify the dispatcher
  SudokuActions.addCandidate(candidate);

  return candidate;
};

// Specifies the hinted cells for this diagram. Call this after adding
// all the constraints and columns. Returns the candidate object that
// was hinted.
Puzzle.prototype.addHint = function(candidateName) {
  // find the specified candidate
  var candidate = this.findCandidate(candidateName);
  if (candidate === undefined) {
    throw new Error("Unknown candidate '" + candidateName + "'");
  }

  // pick any hit in the row, and cover it
  this.cover(0, candidate.getFirstHit().getConstraint());
  this.coverHitConstraints(0, candidate.getFirstHit());
      
  // remember the hints for printing later
  this._hints.push(candidate);

  // notify the dispatcher
  SudokuActions.addHint(candidate);

  return candidate;
};

///////////////// static constants

Puzzle.rowNames = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
Puzzle.colNames = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
Puzzle.boxNames = ["TL", "TC", "TR", "CL", "CC", "CR", "BL", "BC", "BR"];

////////////////// printing

// Returns a (somewhat) human readable representation of the puzzle
Puzzle.prototype.toString = function() {
  if (this.isSolved()) {
    return this.toStringSolved();
  } else {
    return this.toStringUnsolved();
  }
};

// prints a solved puzzle - much more compact than an unsolved puzzle
Puzzle.prototype.toStringSolved = function() {
  var board = [];
  for (var row = 0; row < 9; row++) {
    board[row] = [];
    for (var col = 0; col < 9; col++) {
      board[row][col] = " ";
    }
  }
    
  for (var c of this.getHints()) {
    board[c.getRow()][c.getCol()] = "" + c.getDigit();
  }

  for (var h of this.getSolution()) {
    c = h.getCandidate();
    board[c.getRow()][c.getCol()] = "" + c.getDigit();
  }
  
  // join each row into a single string
  for (row = 0; row < 9; row++) {
    board[row] = board[row].join("");
  }

  // join all the rows, separated by newline
  return board.join("\n");
};

// Returns a (somewhat) human-readable representation of
// an unsolved diagram, showing candidates for unsolved cells
//
// The original hints are surrounded by '*', the solved cells are
// surrounded by '+'
Puzzle.prototype.toStringUnsolved = function() {
  var rows = 3 * 9 + 8;   // use '-' to separate rows
  var cols = 3 * 9 + 8 * 3; // use ' | ' to separate columns

  var board = [];
  
  // draw a grid every 4th line, every 6th column, no borders needed
  for (var row = 0; row < rows; row++) {
    board[row] = [];

    for (var col = 0; col < cols; col++) {
      if (row % 4 == 3 && col % 6 == 4)
        board[row][col] = "+";
      else if (row % 4 == 3)
        board[row][col] = "-";
      else if (col % 6 == 4)
        board[row][col] = "|";
      else
        board[row][col] = " ";
    }
  }

  // show the hints in the center of their cells, surrounded by '*'
  for (var c of this.getHints())
    this.setSingleValue(board, c.getRow(), c.getCol(), c.getDigit(), "*");

  // show the solved cells in the center of their cells, surrounded by '+'
  for (c of this.getSolution().map(h => h.getCandidate()))
    this.setSingleValue(board, c.getRow(), c.getCol(), c.getDigit(), "+");

  // show the candidates in a little matrix within their cell
  for (c of this.getActiveCandidates()) {
    this.setCandidate(board, c.getRow(), c.getCol(), c.getDigit());
  }

  // join each row into a single string
  for (row = 0; row < rows; row++) {
    board[row] = board[row].join("");
  }

  // join all the rows, separated by newline
  return board.join("\n");
};

// puts a solved or hinted cell into its proper place on a
// printable unsolved puzzle
Puzzle.prototype.setSingleValue = function(board, row, col, digit, tag) {
  
  board[row*4 + 1][col*6 + 1] = "" + digit;
  board[row*4][col*6 + 1] = tag;
  board[row*4 + 2][col*6 + 1] = tag;
  board[row*4 + 1][col*6] = tag;
  board[row*4 + 1][col*6 + 2] = tag;
};

// puts a single unsolved candidate into its proper place
// on a printable unsolved puzzle
Puzzle.prototype.setCandidate = function(board, row, col, digit) {
  var rowOffs =  Math.floor((digit - 1) / 3);
  var colOffs = (digit - 1) % 3;
  
  board[row*4 + rowOffs][col*6 + colOffs] = "" + digit;
};

module.exports = Puzzle;