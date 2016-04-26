var sudokuConst = require("../constants/sudokuConst.js");
var sudokuUnitNames = sudokuConst.sudokuUnitNames;
var Hit = require("./hit.js");

// Returns an object representing a Sudoku constraint. In a standard Sudoku,
// this is either:
//  - each cell must contain a single digit
//  - each row and column must contain the digits 1 through 9 once each
//  - each 3x3 'box' must contains the digits 1 through 9 once each
//
// Each constraint has a linked list of 'hits' indicating the candidates that
// can satisfy that particular constraint. A set of candidates that 'solves' the
// puzzle will collectively contain exactly one hit in each constraint.
//
var Constraint = function(head, name, unitType, unitName) {
  // safety
  if (!(this instanceof Constraint)) {
    return new Constraint(head, name, unitType, unitName);
  }
  if (arguments.length !== 4) {
    throw new Error("Constraint(): wrong number of arguments: " + arguments.length);
  }

  // private immutables
  this._head = head;
  this._name = name;
  this._unitType = unitType;
  this._unitName = unitName;

  // private mutables
  this._len = 0;
  this._prev = this;
  this._next = this;

  // A sequence number that increases as the _nextRow links are followed.
  // Used to do linear-time intersection operations on the hits in a
  // constraint. Automatically assigned by addToConstraintList().
  this._num = 0;

  // link the head of the hit list into this constraint
  head.addToConstraint(this);
};

// getters
Constraint.prototype.getHead = function() {
  return this._head;
};
Constraint.prototype.getName = function() {
  return this._name;
};
Constraint.prototype.getUnitType = function() {
  return this._unitType;
};
Constraint.prototype.getUnitName = function() {
  return this._unitName;
};
Constraint.prototype.getLength = function() {
  return this._len;
};
Constraint.prototype.getPrev = function() {
  return this._prev;
};
Constraint.prototype.getNext = function() {
  return this._next;
};
Constraint.prototype.getNum = function() {
  return this._num;
};
Constraint.prototype.getDisplayName = function() {
  return sudokuUnitNames[this._unitType].name + " " + this._unitName;
};

// Adds the column to the constraint list (during puzzle setup)
Constraint.prototype.addToConstraintList = function(rootConstraint) {
  this._prev = rootConstraint.getPrev();
  this._next = rootConstraint;
  this.getPrev()._next = this;
  this.getNext()._prev = this;
  this._num = this.getPrev().getNum() + 1; 
};
  
// Removes this constraint from the constraint list (during cover)
Constraint.prototype.unlinkFromConstraintList = function() {
  this.getPrev()._next = this.getNext();
  this.getNext()._prev = this.getPrev();
};

// Relinks this constraint into the constraint list (during backtracking)
Constraint.prototype.relinkIntoConstraintList = function() {
  this.getPrev()._next = this;
  this.getNext()._prev = this;
};

// Links this constraint into the constraint list at a specified position
// (when manually removing a solution)
Constraint.prototype.linkIntoConstraintListAt = function(cIns) {
  this._prev = cIns.getPrev();
  this._next = cIns;
  cIns.getPrev()._next = this;
  cIns._prev = this;
};
  
// Adds a hit to this constraint's hit list (during puzzle setup)
Constraint.prototype.addHit = function(hit) {
  // add hit to the constraint's hit list, bump node count
  hit.addToConstraint(this);
  this._len++;
};

// Unlinks the hit from this constraint (during cover)
Constraint.prototype.unlinkHit = function(hit) {
  hit.unlinkFromConstraint();
  this._len--;
};

// Relinks the hit into this constraint (during backtracking or undo)
Constraint.prototype.relinkHit = function(hit) {
  hit.relinkIntoConstraint();
  this._len++;
};

// Empties the constraint's hit list.
Constraint.prototype.clearHits = function() {
  // Just create a new head node that points to the constraint,
  // with up and down pointer pointing to itself.
  this._head = new Hit(this.getHead());
};

// Returns true if the candidates that hit this constraint are
// a (possibly equal) subset of the candidates that hit the passed-in
// constraint.
Constraint.prototype.isSubsetOf = function(c) {
  if (this.getLength() > c.getLength()) {
    return false;
  }
  
  // run a merge against the two lists, which should be sorted on
  // the candidate number
  var h1 = this.getHead().getDown();
  var h2 = c.getHead().getDown();
  while (h1 !== this.getHead()) {
    // skip the hits h2 in the passed-in constraint that don't match
    while (h2 !== c.getHead() &&
        h2.getCandidate().getNum() < h1.getCandidate().getNum()) {
      h2 = h2.getDown();
    }

    // didn't find a match for h1, so this constraint is not a subset
    if (h2 === c.getHead() ||
      h2.getCandidate().getNum() > h1.getCandidate().getNum()) {
      // didn't find a match for h1, so this constraint is not a subset
      return false;
    }
    h1 = h1.getDown();
  }
  return true;
};

// Returns true if the candidates that hit this constraint are a strict
// subset of the candidates that hit the passed-in constraint.
Constraint.prototype.isStrictSubsetOf = function(c) {
  if (this.getLength() >= c.getLength()) {
    return false;
  }
  return this.isSubsetOf(c);
};

// Returns a list of hits against this constraint whose candidates
// do not hit the passed-in constraint.
Constraint.prototype.minus = function(c) {
  var difference = [];
  
  // run a merge against the two lists, which should be sorted on
  // the candidate number
  var h1 = this.getHead().getDown();
  var h2 = c.getHead().getDown();
  while (h1 !== this.getHead()) {
    // skip the hits h2 in the passed-in constraint that don't match
    while (h2 !== c.getHead() &&
        h2.getCandidate().getNum() < h1.getCandidate().getNum()) {
      h2 = h2.getDown();
    }

    // did we get a matching candidate for h1?
    if (h2 === c.getHead() ||
      h2.getCandidate().getNum() > h1.getCandidate().getNum()) {
      // nope, so add h1 to the difference
      difference.push(h1);
    }
    
    h1 = h1.getDown();
  }
  return difference;
};

// Returns a list of hits against this constraint whose candidates also
// hit the passed-in constraint. In set terms it is those candidates
// that cover both constraints. 
Constraint.prototype.sharedHits = function(c) {
  var intersection = [];
  
  // run a merge against the two lists, which should be sorted on
  // the candidate number
  var h1 = this.getHead().getDown();
  var h2 = c.getHead().getDown();
  while (h1 !== this.getHead()) {
    // skip the hits h2 in the passed-in constraint that don't match
    while (h2 !== c.getHead() &&
        h2.getCandidate().getNum() < h1.getCandidate().getNum()) {
      h2 = h2.getDown();
    }

    // did we get a matching candidate for h1?
    if (h2 !== c.getHead() &&
      h2.getCandidate().getNum() === h1.getCandidate().getNum()) {
      // yes, so add the hit to the returned list
      intersection.push(h1);
    }
    
    h1 = h1.getDown();
  }
  return intersection;
};

// Returns true if any candidate hits both this constraint and the
// passed-in constraint. In set terms, true if there is a candidate
// that covers both constraints.
Constraint.prototype.hits = function(c) {
  // run a merge against the two lists, which should be sorted on
  // the candidate number
  var h1 = this.getHead().getDown();
  var h2 = c.getHead().getDown();
  while (h1 != this.getHead()) {
    // skip the hits h2 in the passed-in constraint that don't match
    while (h2 != c.getHead() &&
        h2.getCandidate().getNum() < h1.getCandidate().getNum()) {
      h2 = h2.getDown();
    }

    // did we get a matching candidate for h1?
    if (h2 != c.getHead() &&
      h2.getCandidate().getNum() == h1.getCandidate().getNum()) {
      // yes, so we have a candidate that hits both constraints
      return true;
    }
    
    h1 = h1.getDown();
  }

  // never found a candidate that hits both constraints
  return false;
};

module.exports = Constraint;