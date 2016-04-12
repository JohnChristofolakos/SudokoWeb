var Hit = require("./hit.js");

// Creates a new Candidate object representing the possiblity
// that the specified row and column of the diagram contain the
// given digit. Row and column numbers are 1-based.
//
// Candidates are linked into a candidate list, and contain a
// pointer to the head of the list of 'hit's - each hit represents
// an active constraint that is satisfied by the candidate.
//
var Candidate = function (row, col, digit, displayName) {
  // safety
  if (!(this instanceof Candidate)) {
    return new Candidate(row, col, digit, displayName);
  }
  if (arguments.length !== 4) {
    throw new Error("Candidate(): wrong number of arguments: " + arguments.length);
  }

  // private immutable data
  this._row = row;
  this._col = col;
  this._digit = digit;
  this._name = "r" + row + "c" + col + "d" + digit;
  this._displayName = displayName;

  // private mutable data
  this._next = this;
  this._prev = this;
  this._firstHit = null;
  this._len = 0;

  // A sequence number that increases as the _nextRow links are followed.
  // Used to do linear-time intersection operations on the hits in a
  // constraint. Automatically assigned by addToCandidateList().
  this._num = 0;
};

// The usual getters
Candidate.prototype.getRow = function() {
  return this._row;
};
Candidate.prototype.getCol = function() {
  return this._col;
};
Candidate.prototype.getDigit = function() {
  return this._digit;
};
Candidate.prototype.getDisplayName = function() {
  return this._displayName;
};
Candidate.prototype.getNext = function() {
  return this._next;
};
Candidate.prototype.getPrev = function() {
  return this._prev;
};
Candidate.prototype.getFirstHit = function() {
  return this._firstHit;
};
Candidate.prototype.getLength = function() {
  return this._len;
};
Candidate.prototype.getNum = function() {
  return this._num;
};

// Returns a concise name for the candidate, for logging
Candidate.prototype.getName = function() {
  return this._name;
};

// Adds this candidate to the candidate list with the specified
// root. Used only during the initial puzzle setup.  
Candidate.prototype.addToCandidateList = function addToCandidateList(root) {
  this._next = root;
  this._prev = root._prev;
  root._prev._next = this;
  root._prev = this;
  this._num = this._prev._num + 1;
};

// Adds a hit to this candidate's list of hits. Used only during puzzle
// setup.
Candidate.prototype.addHit = function addHit(hit) {
  hit.addToCandidate(this);
  this._len++;

  if (this._firstHit === null) {
    this._firstHit = hit;
  }
};

// Unlinks the candidate from the candidate list. Used during cover
// and candidate elimination.
Candidate.prototype.unlinkFromCandidateList =
  function unlinkFromCandidateList() {
    this._next._prev = this._prev;
    this._prev._next = this._next;
  };

// Relinks the candidate into the candidate list, used during
// backtracking and undo.
Candidate.prototype.relinkIntoCandidateList =
  function relinkIntoCandidateList() {
    this._prev._next = this._next._prev = this;
  };

// Return a less concise representation of the row, for logging
Candidate.prototype.toString = function toString() {
  var s = "";
  if (this.getName() !== null)
    s = s + this.getName() + ": ";

  if (this.getFirstHit() === null) {
    s = s + "no hits";
  } else {
    var hit = this.getFirstHit();
    do {
      s = s + hit.getConstraint().getName() + " ";
      hit = hit.getRight();
    }
    while (hit !== this.getFirstHit());
  }

  return s;
};

// Returns a dummy candidate with a list of hits indicating the
// constraints where this candidate conflicts with the passed-in
// candidate
Candidate.prototype.sharedHits = function sharedHits(c) {
  var hits = new Candidate(this.getRow(), this.getCol(), this.getDigit(),
          "r" + this.getRow() + "c" + this.getCol() + "d" + this.getDigit());
  
  if (this.getFirstHit() === null || c.getFirstHit() === null)
    return hits;

  var h1 = this.getFirstHit();
  var h2 = c.getFirstHit();

  // a little awkward since rows don't have header nodes
  do {
    while (h2.getConstraint().getNum() <
        h1.getConstraint().getNum()) {
      h2 = h2.getRight();
      if (h2 === c.getFirstHit()) {
        // *** early return ***
        return hits;
      }
    }
    if (h2.getConstraint().getNum() === h1.getConstraint().getNum())
      hits.addHit(new Hit(h1));

    h1 = h1.getRight();
  }
  while (h1 !== this.getFirstHit());

  return hits;
};

// Returns true if this candidate hits a constraint that is also
// hit by the passed-in candidate
Candidate.prototype.hits = function hits(c) {
  if (this.getFirstHit() === null || c.getFirstHit() === null)
    return false;
  
  var h1 = this.getFirstHit();
  var h2 = c.getFirstHit();

  // a little awkward since rows don't have header nodes
  do {
    while (h2.getConstraint().getNum() < h1.getConstraint().getNum()) {
      h2 = h2.getRight();
      if (h2 === c.getFirstHit()) {
        // *** reached the end of h2's hits without a match
        return false;
      }
    }
    if (h2.getConstraint().getNum() === h1.getConstraint().getNum()) {
      // *** found a matching constraint
      return true;
    }

    h1 = h1.getRight();
  }
  while (h1 != this.getFirstHit());

  // hit the end of this's hits without finding a match
  return false;
};

// Returns the first hit for this candidate that shares a common
// constraint with all of the passed-in candidates, or null if
// there is no such hit.
Candidate.prototype.findCommonConstraint = function() {
  if (this.getFirstHit() === null) {
    return null;
  }
  for (var c of arguments) {
    if (c.getFirstHit() === null) {
      return null;
    }
  }

  var h = this.getFirstHit();
  var hList = [];
  for (c of arguments)
    hList.push(c.getFirstHit());

  // a little awkward since rows don't have header nodes
  do {
    // step all the candidate's current hit forward until their
    // constraint number is greater than or equal to this candidate's
    // current hit's constraint number
    for (var i = 0; i < hList.length; i++) {
      while (hList[i].getConstraint().getNum() < h.getConstraint().getNum()) {
        hList[i] = hList[i].getRight();
        if (hList[i] === arguments[i].getFirstHit())
          // if we run out of hits in any candidate, then
          // we have no common constraint
          return null;
      }
    }

    // check if we've found a common constraint
    var foundIt = true;
    for (var hh of hList) { 
      if (hh.getConstraint().getNum() !== h.getConstraint().getNum()) {
        foundIt = false;
        break;
      }
    }

    // we never reset foundIt, so this is a common constraint
    if (foundIt)
      return h;

    // some candidate does not share h's constraint, so step it forward
    // and try again
    h = h.getRight();
  }
  while (h !== this.getFirstHit());
  
  // hit the end of this's hit list without finding a common constraint
  return null;
};

module.exports = Candidate;