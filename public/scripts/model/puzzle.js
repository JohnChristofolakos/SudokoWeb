var Hit = require("./hit.js");
var Candidate = require("./candidate.js");
var Constraint = require("./constraint.js");
var UnitTypes = require("../constants/sudokuConst.js").sudokuUnitTypes;

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

  // These are the Candidates eliminated by the logical solver or the user
  this._eliminated = [];
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

// Returns the list of candidates that were initially given as hints for
// the puzzle.
Puzzle.prototype.getHints = function() {
  return this._hints.slice();
};

// Returns the list of hits whose candidates are in the current solution
Puzzle.prototype.getSolution = function() {
  return this._solution.slice();
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
           c = c.getNext()
      ) {
    if (lenFilter === undefined || c.getLength() == lenFilter) {
      list.push(c);
    }
  }
  return list;
};

// Returns a list of the eliminated candidates
Puzzle.prototype.getEliminatedCandidates = function() {
  return this._eliminated.slice();
};

// Returns the constraint with the given name, or undefined.
Puzzle.prototype.findConstraint = function(name) {
  for (var c = this.getRootConstraint().getNext();
           c !== this.getRootConstraint();
           c = c.getNext()
      ) {
    if (c.getName() === name) {
      return c;
    }
  }
  return undefined;
};

// Returns the candidate with the given name, or with the given row, column
// and digit. Returns undefined if there is no such active candidate.
Puzzle.prototype.findCandidate = function(name) {
  // support calling with row, col, digit as arguments
  if (arguments.length === 3) {
    var row = arguments[0], col = arguments[1], digit = arguments[2];

    for (var c = this.getRootCandidate().getNext();
             c !== this.getRootCandidate();
             c = c.getNext()
        ) {
      if (c.getRow() === row && c.getCol() === col && c.getDigit() === digit) {
        return c;
      }
    }
  }
  else {
    for (c = this.getRootCandidate().getNext();
             c !== this.getRootCandidate();
             c = c.getNext()) {
      if (c.getName() === name) {
        return c;
      }
    }
  }
  return undefined;
};

// Returns the eliminated candidate with the given name, or with the given
// row, column and digit. Returns undefined if there is no such eliminated candidate.
Puzzle.prototype.findEliminatedCandidate = function(name) {
  // support calling with row, col, digit as arguments
  if (arguments.length === 3) {
    var row = arguments[0], col = arguments[1], digit = arguments[2];

    return this._eliminated.find(c => c.getRow() === row &&
                                      c.getCol() === col &&
                                      c.getDigit() === digit);
  }
  else {
    return this._eliminated.find(c => c.getName() === name);
  }
};

////////////////// private for use by the mutating routines below

// Unlinks this candidate from the candidates list, can be undone by
// _relinkCandidate if the candidate list has not otherwise been changed.
//
Puzzle.prototype._unlinkCandidate = function(c) {
  if (c.constructor !== Candidate) {
    throw new Error("Puzzle._unlinkCandidate: parameter should be Candidate");
  }

  c.unlinkFromCandidateList();
  this._candidateCount--;
};

// Relinks this candidate into the candidates list after it was _unlinked. The
// restof the candidates list must be in the same state as when the _unlink was
// done.
//
Puzzle.prototype._relinkCandidate = function(c) {
  if (c.constructor !== Candidate) {
    throw new Error("Puzzle._relinkCandidate: parameter should be Candidate");
  }

  c.relinkIntoCandidateList();
  this._candidateCount++;
};


// Links the candidate into the proper place on the candidates list, used
// when _relink is not allowed.
Puzzle.prototype._linkCandidate = function(c) {
  if (c.constructor !== Candidate) {
    throw new Error("Puzzle._linkCandidate: parameter should be Candidate");
  }

  // step through the active candidates until we hit the first one with a number
  // greater than this candidate, or we're back at the root candidate
  for (var cIns = this._rootCandidate.getNext();
           cIns != this._rootCandidate;
           cIns = cIns.getNext()
      ) {
    if (c.getNum() < cIns.getNum()) {
      // here's where it gets inserted, just before this one
      break;
    }
  }

  // link it into the candidate list at the spot that preserves the numbering
  c.linkIntoCandidateListAt(cIns);
  this._candidateCount++;
};

// Links a constraint back into the constraint list at the proper position,
// used when uncover is not allowed.
Puzzle.prototype._linkConstraint = function(c) {
  if (c.constructor !== Constraint) {
    throw new Error("Puzzle._linkConstraint: parameter should be Constraint");
  }

  // step through the active constraints until we hit the first one with a number
  // greater than this constraint, or we're back at the root constraint
  for (var cIns = this._rootConstraint.getNext();
           cIns != this._rootConstraint;
           cIns = cIns.getNext()
      ) {
    if (c.getNum() < cIns.getNum()) {
      // here's where it gets inserted, just before this one
      break;
    }
  }

  // link it into the constraint list at the spot that preserves the numbering
  c.linkIntoConstraintListAt(cIns);
  this._constraintCount++;
};

/////////////// mutating routines used during solving - all are reversible

// When a candidate is blocked, it leaves all lists except the list of the
// constraint that is being covered. Thus a hit is never removed from a list
// twice.
//
// Returns an array containing the candidates that were removed.
//
Puzzle.prototype.cover = function(constraint) {
  if (constraint.constructor !== Constraint) {
    throw new Error("Puzzle.cover: parameter should be Constraint");
  }

  var eliminatedCandidates = [];

  // unlink the constraint from the constraint list
  constraint.unlinkFromConstraintList();
  this._constraintCount--;
  
  // Remove all candidates that have a hit against this constraint,
  // one of them at a time will be tried as part of the solution set,
  // the others will conflict
  for (var hit = constraint.getHead().getDown();
           hit != constraint.getHead();
           hit = hit.getDown()
      ) {
    for (var h = hit.getRight(); h !== hit; h = h.getRight()) {
      // unlink the hit from its constraint, and bump the update count
      h.getConstraint().unlinkHit(h);
    }
    
    // remove the candidate from the candidates list
    this._unlinkCandidate(hit.getCandidate());

    // push it onto the eliminated candidates list
    this._eliminated.push(hit.getCandidate());
    eliminatedCandidates.push(hit.getCandidate());
  }

  return eliminatedCandidates;
};

// "Uncovering is done in precisely the reverse order. The pointers thereby
// execute an exquisitely choreographed dance which returns them almost
// magically to their former state."  - D. Knuth
//
// Returns an array containing the candidates that were relinked.
//
Puzzle.prototype.uncover = function(constraint) {
  if (constraint.constructor !== Constraint) {
    throw new Error("Puzzle.uncover: parameter should be Constraint");
  }

  var relinkedCandidates = [];

  for (var hit = constraint.getHead().getUp();
           hit !== constraint.getHead();
           hit = hit.getUp()
      ) {
    for (var h = hit.getLeft(); h != hit; h = h.getLeft()) {
      h.getConstraint().relinkHit(h);
    }
    
    // add the candidate back into the candidates list
    this._relinkCandidate(hit.getCandidate());

    // push it onto the 'relinked' list
    relinkedCandidates.push(hit.getCandidate());
  }

  // link the constraint back into the constraint list
  constraint.relinkIntoConstraintList();
  this._constraintCount++;

  return relinkedCandidates;
};

// Covers all the constraints covered by this hit's candidate, excepting
// the constraint covered by this hit itself.
//
// Returns a list of the candidates eliminated.
//
Puzzle.prototype.coverHitConstraints = function(hit) {
  if (hit.constructor !== Hit) {
    throw new Error("Puzzle.coverHitConstraints: parameter should be Hit");
  }

  var eliminatedCandidates = [];

  for (var h = hit.getRight(); h !== hit; h = h.getRight()) {
    this.cover(h.getConstraint()).forEach(c => eliminatedCandidates.push(c));
  }

  return eliminatedCandidates;
};

// "We included left links, thereby making the rows doubly linked, so
// that constraints would be uncovered in the correct LIFO order in this
// part of the program. (The uncover routine itself could have done its
// job with right links only.) (Think about it.)"  - D.Knuth
//
// Returns an array containing the candidates that were relinked.
//
Puzzle.prototype.uncoverHitConstraints = function(hit) {
  if (hit.constructor !== Hit) {
    throw new Error("Puzzle.uncoverHitConstraints: parameter should be Hit");
  }

  var relinkedCandidates = [];

  for (var h = hit.getLeft(); h !== hit; h = h.getLeft()) {
    this.uncover(h.getConstraint()).forEach(c => relinkedCandidates.push(c));
  }

  return relinkedCandidates;
};

// Removes a candidate that has been eliminated by the logical
// solver or by the user.
//
// Returns true if the operation succeeded (which it always should)
//
Puzzle.prototype.eliminateCandidate = function(candidate) {
  if (candidate.constructor !== Candidate) {
    throw new Error("Puzzle.eliminateCandidate: parameter should be Candidate");
  }

  // unlink the candidate's hits from their constraints
  var h = candidate.getFirstHit();
  do {
    h.getConstraint().unlinkHit(h);
    h = h.getRight();
  }
  while (h !== candidate.getFirstHit());
  
  // unlink the candidate from the candidates list
  this._unlinkCandidate(candidate);

  // push it onto the eliminated candidates list
  this._eliminated.push(candidate);

  return true;
};

// Restores a candidate that was eliminated by the logical solver
// or by a human solver. Returns the restored candidate.
//
// Needed if the logical solver is alternated with the backtracking
// solver, in order to find chains, and to support undo.
//
// Note that the puzzle must be in the same state as when the candidate
// was removed- i.e. this should only be used to support backtracking or
// undo operations, not manually adding an arbitrary candidate.
//
Puzzle.prototype.restoreCandidate = function() {
  if (arguments.length !== 0) {
    throw new Error("Puzzle.restoreCandidate: too many arguments");
  }

  var c = this._eliminated.pop();

  // link the candidate's hits back into their constraint lists
  var h = c.getFirstHit();
  do {
    h.getConstraint().relinkHit(h);
    h = h.getLeft();
  }
  while (h !== c.getFirstHit()); 
  
  // link the candidate back into the candidates list
  this._relinkCandidate(c);
  
  return c;
};

// Pushes a candidate onto the solution list (possibly tentatively).
Puzzle.prototype.pushSolution = function(hit) {
  if (hit.constructor !== Hit) {
    throw new Error("Puzzle.pushSolution: parameter should be Hit");
  }

  this._solution.push(hit);
};

// Pops the last candidate off the solution list (during backtracking/undo)
Puzzle.prototype.popSolution = function() {
  var hit = this._solution.pop();
  return hit;
};

// Convenience method to wrap cover, coverNodeColumns and pushSolution, returns true
// if the solution is valid (doesn't conflict with other solver/hinted cells).
//
// Adds candidates eliminated by the solved cell to the eliminatedCandidates array.
//
Puzzle.prototype.solve = function(hit, eliminatedCandidates) {
  if (hit.constructor !== Hit) {
    throw new Error("Puzzle.solve: parameter should be Hit");
  }

  // double check it is OK to solve this candidate - all of its hits must be
  // against active constraints
  var c = hit.getCandidate();
  var activeConstraints = this.getActiveConstraints();
  var h = c.getFirstHit();
  do {
    if (activeConstraints.find(c => c === h.getConstraint()) === undefined) {
      console.log("Attempted to solve with conflicting candidate at row " + c.getRow() +
                  ", col " + c.getCol() + ", digit " + c.getDigit());
      return false;
    }

    h = h.getRight();
  }
  while (h !== c.getFirstHit());

  this.cover(hit.getConstraint()).forEach(c => eliminatedCandidates.push(c));
  this.coverHitConstraints(hit).forEach(c => eliminatedCandidates.push(c));
  this.pushSolution(hit);

  return true;
};

// Convenience method to wrap popSolution, uncoverNodeColumns and uncover
// To be used only for backtracking/undo, not to manually remove a solution
//
// Adds candidates that are relinked to the relinkedCandidates array. Returns
// the solution hit that was popped.
//
Puzzle.prototype.unsolve = function(relinkedCandidates) {
  var hit = this.popSolution();
  this.uncoverHitConstraints(hit).forEach(c => relinkedCandidates.push(c));
  this.uncover(hit.getConstraint()).forEach(c => relinkedCandidates.push(c));
  return hit;
};

// Adds the specified candidate to the diagram manually, e.g. as directed by a
// human solver. The candidate is checked to be not in conflict with any solved
// or hinted cells, if it is then nothing is done.
//
// Note this operation cannot be reversed using the 'dancing links' approach.
//
// Returns true if the operation succeeded.
//
Puzzle.prototype.manuallyAddCandidate = function(c) {
  if (c.constructor !== Candidate) {
    throw new Error("Puzzle.manuallyAddCandidate: parameter should be Candidate");
  }

  // double check it is OK to add this candidate - all of its hits must be
  // against active constraints
  var activeConstraints = this.getActiveConstraints();
  var h = c.getFirstHit();
  do {
    if (activeConstraints.find(c => c === h.getConstraint()) === undefined) {
      console.log("Attempted to manually add conflicting candidate at row " + c.getRow() +
                  ", col " + c.getCol() + ", digit " + c.getDigit());
      return false;
    }

    h = h.getRight();
  }
  while (h !== c.getFirstHit());

  // looks good, relink the candidate back into the candidate's list
  this._linkCandidate(c);

  // then add the candidate's hits back into their constraints
  h = c.getFirstHit();
  do {
    h.getConstraint().addHit(h);

    h = h.getRight();
  }
  while (h !== c.getFirstHit());

  // remove the candidate from the eliminated list
  var i = this._eliminated.findIndex(c => c === c);
  if (i >= 0) {
    this._eliminated.splice(i, 1);
  }
  else {
    console.log("Could not remove manually added candidate from the eliminated list " + c.getName());
    // but return true anyway as we did update the puzzle's candidates
  }

  return true;
};

// Removes a previously solved cell from the solution by putting all of its covered
// constraints back into the active constraint list. The cell will have no candidates
// after this operation is complete, and all of the restored constraints will have
// empty hit lists.
//
// Note this operation cannot be reversed using the 'dancing links' approach.
//
// Returns true if the operation succeeded (which it always should).
//
Puzzle.prototype.manuallyRemoveSolution = function(c) {
  if (c.constructor !== Candidate) {
    throw new Error("Puzzle.manuallyRemoveSolution: parameter should be Candidate");
  }

  // loop through the solved candidate's hits
  var h = c.getFirstHit();
  do {
    // relink the hit's constraints into the constraint list
    this._linkConstraint(h.getConstraint());

    // but empty each constraint's hit list, they'll be repopulated as possible
    // candidates are added back
    h.getConstraint().clearHits();

    h = h.getRight();
  }
  while (h != c.getFirstHit());

  return true;
};

//////////////// initial puzzle setup

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
Puzzle.prototype.addCandidate = function(constraintNames,
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
  this.cover(candidate.getFirstHit().getConstraint());
  this.coverHitConstraints(candidate.getFirstHit());
      
  // remember the hints for printing later
  this._hints.push(candidate);

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
    
  this._hints.map(c => {
    board[c.getRow()][c.getCol()] = "" + c.getDigit();
  });

  this._solution.map(h => {
    var c = h.getCandidate();
    board[c.getRow()][c.getCol()] = "" + c.getDigit();
  });
  
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
  this._hints.map(c => {
    this.setSingleValue(board, c.getRow(), c.getCol(), c.getDigit(), "*");
  });

  // show the solved cells in the center of their cells, surrounded by '+'
  this._solution.map(h => h.getCandidate()).map(c => {
    this.setSingleValue(board, c.getRow(), c.getCol(), c.getDigit(), "+");
  });

  // show the candidates in a little matrix within their cell
  this.getActiveCandidates().map(c => {
    this.setCandidate(board, c.getRow(), c.getCol(), c.getDigit());
  });

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

Puzzle.prototype.dumpToConsole = function() {
  console.log("Constraints:");
  for (var c = this.getRootConstraint().getNext(); c != this.getRootConstraint(); c = c.getNext()) {
    var hitNames = "";
    for (var h = c.getHead().getDown(); h != c.getHead(); h = h.getDown()) {
      hitNames += h.getCandidate().getName() + " ";
    }
    console.log("  " + c.getName() + " (" + c.getNum() + ") " + hitNames);
  }

  console.log("Candidates:");
  this.getActiveCandidates().map(c => {
    hitNames = "";
    h = c.getFirstHit();
    do {
      hitNames += h.getConstraint().getName() + " ";
      h = h.getRight();
    }
    while (h !== c.getFirstHit());

    console.log("  " + c.getName() + " " + hitNames);
  });

  console.log("Eliminated candidates:");
  this._eliminated.map(c => {
    hitNames = "";
    h = c.getFirstHit();
    do {
      hitNames += h.getConstraint().getName() + " ";
      h = h.getRight();
    }
    while (h !== c.getFirstHit());

    console.log("  " + c.getName() + " " + hitNames);
  });
};

module.exports = Puzzle;