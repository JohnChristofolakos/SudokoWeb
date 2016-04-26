var Fluxxor = require("fluxxor");
var { Map } = require("immutable");

var { sudokuActionTypes } = require("../constants/sudokuConst.js");
var Candidate = require("../model/candidate.js");

var PuzzleStore = Fluxxor.createStore({
  initialize: function() {
    this.clearState();

    this.bindActions(
      sudokuActionTypes.SET_PUZZLE, this.onSetPuzzle,
      sudokuActionTypes.REMOVE_CANDIDATE, this.onRemoveCandidate,
      sudokuActionTypes.RESTORE_CANDIDATE, this.onRestoreCandidate,
      sudokuActionTypes.SOLVE_CELL, this.onSolveCell,
      sudokuActionTypes.UNSOLVE, this.onUnsolve,

      sudokuActionTypes.SELECT_CELL, this.onSelectCell,
      sudokuActionTypes.UNSELECT_CELL, this.onUnselectCell,
      sudokuActionTypes.SELECT_DIGIT, this.onSelectDigit,
      sudokuActionTypes.UNSELECT_DIGIT, this.onUnselectDigit,
      sudokuActionTypes.TOGGLE_CANDIDATE, this.onToggleCandidate,
      sudokuActionTypes.ADD_SOLUTION, this.onAddSolution,
      sudokuActionTypes.CLEAR_CELL, this.onClearCell
    );
  },

  clearState: function() {
    this.puzzle = null;
    this.candidates = Map();
    this.solution = Map();
    this.hints = Map();
    this.cellRowSelected = -1;
    this.cellColSelected = -1;
    this.digitSelected = 0;
    this.buildSelectedCell();
  },

  getState: function() {
    return {
      candidates: this.candidates,
      solution: this.solution,
      hints: this.hints,
      cellRowSelected: this.cellRowSelected,
      cellColSelected: this.cellColSelected,
      digitSelected: this.digitSelected,
      cellSelected: this.cellSelected
    };
  },

  getPossibleCandidates: function(row, col) {
    var digits = [];
    for (var i =  0; i <= 9; i++) {
      digits[i] = false;
    }

    // if it's hinted then no digits should be enabled
    if (this.hints.has(Candidate.makeCellId(row, col))) {
      return digits;
    }

    // if it's solved, then the current solution should be enabled
    var solution = this.solution.get(Candidate.makeCellId(row, col));
    if (solution !== undefined) {
      digits[solution.getDigit()] = true;
    }
    else {
      // it's unsolved, so all current candidates are enabled
      for (i = 1; i <= 9; i++) {
        if (this.puzzle.findCandidate(Candidate.makeName(row, col, i)))
          digits[i] = true;
      }
    }

    // and all candidates that could be solved or restored without conflicting
    // with a solved/hinted cell
    var activeConstraints = this.puzzle.getActiveConstraints();
    for (i = 1; i <= 9; i++) {
      if (!digits[i]) {
        var c = this.puzzle.findEliminatedCandidate(row, col, i);
        if (c === undefined) {
          console.log("Eliminated candidate not found in list - " +
                      "row " + row + ", col" + col + ", digit " + i);
          // can't check constraints without a candidate object, so just skip it
        } else {
          // check if any of its constraints are covered
          digits[i] = true;
          var h = c.getFirstHit();
          do {
            // If the cell is solved, then all other candidates are bound to conflict
            // with the solution. So skip checking any constraints that are hit by the
            // solution
            var hitsSolution = false;
            if (solution !== undefined) {
              var solutionHit = solution.getFirstHit();
              do {
                if (solutionHit.getConstraint() === h.getConstraint()) {
                  hitsSolution = true;
                  break;
                }
                solutionHit = solutionHit.getRight();
              }
              while (solutionHit != solution.getFirstHit());
            }

            if (!hitsSolution &&
                activeConstraints.find(constraint => h.getConstraint() === constraint) === undefined) {
              // this constraint has been covered, so the candidate would conflict
              digits[i] = false;
              break;
            }

            h = h.getRight();
          }
          while (h !== c.getFirstHit());
        }
      }
    }

    return digits;
  },

  getUnsolvedCandidates: function() {
    var count = [0,0,0,0,0,0,0,0,0,0];
    this.solution.forEach(c => count[c.getDigit()]++);
    this.hints.forEach(c => count[c.getDigit()]++);
    return count.map(n => n !== 9);
  },

  buildSelectedCell: function() {
    this.cellSelected = {
      isHinted: false,
      isSolved: false,
      candidates: []
    };
    if (this.cellRowSelected === -1 || this.cellColSelected === -1)
      return;

    // is the cell hinted?
    var c = this.hints.get(Candidate.makeCellId(this.cellRowSelected, this.cellColSelected));
    if (c !== undefined) {
      this.cellSelected.isHinted = true;
      this.cellSelected.candidates.push(c.getDigit());
      return;
    }

    // is the cell solved?
    c = this.solution.get(Candidate.makeCellId(this.cellRowSelected, this.cellColSelected));
    if (c !== undefined) {
      this.cellSelected.isSolved = true;
      this.cellSelected.candidates.push(c.getDigit());
      return;
    }

    // not hinted or solved, check what candidates it has
    this.candidates.forEach(c => {
      if (c.getRow() === this.cellRowSelected && c.getCol() === this.cellColSelected) {
        this.cellSelected.candidates.push(c.getDigit());
      }
    });
  },

  toggleCandidate: function(row, col, digit) {
    // is it currently a candidate?
    var c = this.puzzle.findCandidate(row, col, digit);
    if (c !== undefined) {
      this.puzzle.eliminateCandidate(c);
    }
    else {
      c = this.puzzle.findEliminatedCandidate(row, col, digit);
      if (c === undefined) {
        console.log("Attempted to restore invalid candidate at row " +
             row + ", col " + col + ", digit " + digit);
        return;
      }

      this.puzzle.manuallyAddCandidate(c);
    }
  },

  onSetPuzzle: function(payload) {
    this.puzzle = payload.puzzle;

    this.candidates = Map(this.puzzle.getActiveCandidates()
        .map(c => { return [ c.getName(), c ]; } ));

    this.solution = Map(this.puzzle.getSolution()
        .map(h => { return [ h.getCandidate().getCellId(), h.getCandidate() ]; } ));

    this.hints = Map(this.puzzle.getHints()
        .map(c => { return [ c.getCellId(), c ]; } ));

    this.emit("change");
  },

  onRemoveCandidate: function(payload) {
    this.puzzle.eliminateCandidate(payload.hit);

    this.candidates = this.candidates.delete(payload.hit.getCandidate().getName());

    this.emit("change");
  },

  // to be used for backtracking/undo only - otherwise use onToggleCandidate
  onRestoreCandidate: function(payload) {
    this.puzzle.restoreCandidate(payload.hit);

    this.candidates = this.candidates.set(
        payload.hit.getCandidate().getName(),
        payload.hit.getCandidate()
    );

    this.emit("change");
  },

  onSolveCell: function(payload) {
    this.puzzle.solve(0, payload.hit);

    this.solution = this.solution.set(
        payload.hit.getCandidate().getCellId(),
        payload.hit.getCandidate()
    );

    this.candidates = Map(this.puzzle.getActiveCandidates()
        .map(c => { return [ c.getName(), c ]; } ));

    this.emit("change");
  },

  // for backtracking/undo only - otherwise use onClearCell
  onUnsolve: function() {
    var hit = this.puzzle.unsolve();

    this.solution = this.solution.delete(hit.getCandidate().getCellId());

    this.candidates = Map(this.puzzle.getActiveCandidates()
        .map(c => { return [ c.getName(), c ]; } ));

    this.emit("change");
  },

  onSelectCell: function(payload) {
    this.cellRowSelected = payload.row;
    this.cellColSelected = payload.col;

    this.buildSelectedCell();

    this.emit("change");
  },

  onUnselectCell: function() {
    this.cellRowSelected = -1;
    this.cellColSelected = -1;
    this.buildSelectedCell();

    this.emit("change");
  },

  onSelectDigit: function(payload) {
    this.digitSelected = payload.digit;

    this.emit("change");
  },

  onUnselectDigit: function() {
    this.digitSelected = 0;

    this.emit("change");
  },

  onToggleCandidate: function(payload) {
    this.toggleCandidate(payload.row, payload.col, payload.digit);

    this.candidates = Map(this.puzzle.getActiveCandidates()
        .map(c => { return [ c.getName(), c ]; } ));

    this.buildSelectedCell();

    this.emit("change");
  },

  onAddSolution: function(payload) {
    var c = this.puzzle.findCandidate(payload.row, payload.col, payload.digit);
    if (c === undefined) {
      // it's OK to add a manually eliminated candidate as a solution
      c = this.puzzle.findEliminatedCandidate(payload.row, payload.col, payload.digit);
    }
    if (c === undefined) {
      console.log("Attempted to add invalid solution at row " + payload.row +
                  ", col" + payload.col + ", digit " + payload.digit);
    }
    this.onSolveCell({ hit: c.getFirstHit() });

    this.buildSelectedCell();

    this.emit("change");
  },

  onClearCell: function(payload) {
    // check if this is a hinted cell
    if (this.hints.has(Candidate.makeCellId(payload.row, payload.col))) {
      // can't clear a hinted cell, just ignore the click
      return;
    }

    // is this a solved cell?
    var c = this.solution.get(Candidate.makeCellId(payload.row, payload.col));
    if (c !== undefined) {
      // solved, so manually remove the solution
      this.puzzle.manuallyRemoveSolution(c);

      /// and update the solution state
      this.solution = this.solution.delete(Candidate.makeCellId(payload.row, payload.col));
    }

    // toggle any eliminated candidates back into the cell
    var possibleCandidates = this.getPossibleCandidates(payload.row, payload.col);
    for (var digit = 1; digit <= 9; digit++) {
      if (possibleCandidates[digit]) {
        if (!this.candidates.find(c => c.getRow() === payload.row &&
                                       c.getCol() === payload.col &&
                                       c.getDigit() === digit
                                 )) {
          this.toggleCandidate(payload.row, payload.col, digit);
        }
      }
    }

    // rebuild the candidates map
    this.candidates = Map(this.puzzle.getActiveCandidates()
        .map(c => { return [ c.getName(), c ]; } ));

    this.buildSelectedCell();

    this.emit("change");
  }

});

module.exports = PuzzleStore;