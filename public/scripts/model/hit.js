// Returns an object that denotes a candidate hitting a particular constraint.
// Hits are linked into two doubly-linked lists - one list for the hits by
// a particular candidate, the other for the list of hits against a constraint.
//
// Optionally, the constructor takes a hit parameter which creates a copy
// of the passed-in hit.
//
var Hit = function(h) {
  // safety
  if (!(this instanceof Hit)) {
    return new Hit(h);
  }
  if (arguments.length !== 0 && arguments.length != 1) {
    throw new Error("Hit(): wrong number of arguments: " + arguments.length);
  }
  
  // initialize private mutables
  this._constraint = null;    // the constraint that is hit
  this._candidate = null;     // the candidate doing the hitting
  this._left = this;        // predecessor in the canididate hit list
  this._right = this;       // successor in the candidate hit list
  this._up = this;        // predecessor in the constraint hit list
  this._down = this;        // successor in the constraint hit list

  // special case for building dummy candidates, used to build multi-candidate
  // intersections
  if (h !== undefined && h !== null) {
    this._constraint = h.getConstraint();
  }
};

Hit.prototype.getLeft = function() {
  return this._left;
};
Hit.prototype.getRight = function() {
  return this._right;
};
Hit.prototype.getUp = function() {
  return this._up;
};
Hit.prototype.getDown = function() {
  return this._down;
};
Hit.prototype.getConstraint = function() {
  return this._constraint;
};
Hit.prototype.getCandidate = function() {
  return this._candidate;
};

// Adds this hit into a constraint's hit list (during puzzle setup).
// Should be called only by Constraint.addHit(), other clients should
// use Constraint.addHit().
//
Hit.prototype.addToConstraint = function(c) {
  this._constraint = c;
  this._up = c.getHead().getUp();
  this._down = c.getHead();
  c.getHead().getUp()._down = this;
  c.getHead()._up = this;
};

// Adds this hit into a candidate's hit list (during puzzle setup).
// Should be called only by Candidate.addHit(), other clients should
// use Candidate.addHit().
//
Hit.prototype.addToCandidate = function(c) {
  this._candidate = c;
  if (c.getFirstHit() !== null) {
    this._left = c.getFirstHit().getLeft();
    this._right = c.getFirstHit();
    c.getFirstHit().getLeft()._right = this;
    c.getFirstHit()._left = this;
  }
};

// Unlinks this hit from its constraint (during cover or row elimination)
Hit.prototype.unlinkFromConstraint = function() {
  var uu = this._up;
  var dd = this._down;
  uu._down = dd;
  dd._up = uu;
};

// Relinks this hit into its former constraint (during backtracking or undo)
Hit.prototype.relinkIntoConstraint = function() {
  var uu = this.getUp();
  var dd = this.getDown();
  uu._down = this;
  dd._up = this;
};

// Returns a display representation of the hit, for hinting
Hit.prototype.getDisplayName = function() {
  return (this.getCandidate() === null
            ? "???"
            : this.getCandidate().getDigit()) +
          " in " +
          (this.getConstraint() === null
            ? "???"
            : this.getConstraint().getDisplayName());
};

// Returns a readable representation of the hit's candidate, for logging
//
// This is a little different from Candidate.displayName() in that:
// - this hit will be the leftmost hit displayed
// - at the end of the line an indication in given of this hit's position 
//   in its constraint's hit list, or
// - whether this hit was not found in its constraint's hit list (which
//   means its candidate has been eliminated from the puzzle.
//
Hit.prototype.toString = function() {
  var s  = "";

  if (this.getCandidate() === null) {
    // it hasn't been linked in - nothing very useful to display
    return "unlinked";
  }

  if (this.getCandidate().getName() != null) {
    s = s + this.getCandidate().getName() + ": ";
  }
  
  var q = this;
  do {
    s = s + q.getConstraint().getName() + " ";
    q = q.getRight();
  }
  while (q !== this);
  
  var k = 1;
  for (q = this.getConstraint().getHead().getDown(); q !== this; k++) {
    if (q === this.getConstraint().getHead()) {
      s = s + "(not in its constraint)";
      return s;
    }
    else {
      q = q.getDown();
    }
  }
  s = s + "(" + k + " of " + this.getConstraint().getLength() + ")";
  return s;
};

module.exports = Hit;