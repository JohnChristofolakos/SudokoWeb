var Fluxxor = require("fluxxor");
var { Map } = require("immutable");

var { sudokuActionTypes } = require("../constants/sudokuConst.js");
var Candidate = require("../model/candidate.js");

var PuzzleStore = Fluxxor.createStore({
  initialize: function() {
    this.clearState();

    this.bindActions(
      sudokuActionTypes.SET_PUZZLE, this.onSetPuzzle,
      sudokuActionTypes.TOGGLE_CANDIDATE, this.onToggleCandidate,
      sudokuActionTypes.ADD_SOLUTION, this.onAddSolution,
      sudokuActionTypes.CLEAR_CELL, this.onClearCell,

      sudokuActionTypes.PUZZLE_UNDO, this.puzzleUndo,
      sudokuActionTypes.PUZZLE_REDO, this.puzzleRedo,

      sudokuActionTypes.SELECT_CELL, this.onSelectCell,
      sudokuActionTypes.UNSELECT_CELL, this.onUnselectCell,
      sudokuActionTypes.SELECT_DIGIT, this.onSelectDigit,
      sudokuActionTypes.UNSELECT_DIGIT, this.onUnselectDigit
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

    this.undoStack = [];
    this.undoIndex = 0;
  },

  getState: function() {
    return {
      candidates: this.candidates,
      solution: this.solution,
      hints: this.hints,
      cellRowSelected: this.cellRowSelected,
      cellColSelected: this.cellColSelected,
      digitSelected: this.digitSelected,
      cellSelected: this.cellSelected,
      undoAvailable: this.undoIndex > 0,
      redoAvailable: this.undoIndex < this.undoStack.length
    };
  },

  // Returns true if the specified digit could be placed at row, col
  // without conflicting with a solved or hinted cell.
  //
  // If the solution parameter is defined, then any constraints hit
  // by the solution (which must be a Candidate object) are ignored. 
  //
  isPossibleCandidate: function(row, col, digit, solution) {
    var c = this.puzzle.findEliminatedCandidate(row, col, digit);
    if (c === undefined) {
      console.log("Eliminated candidate not found in list - " +
                  "row " + row + ", col" + col + ", digit " + digit);
      // can't check constraints without a candidate object
      return false;
    }

    // check if any of its constraints are covered
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
          !this.puzzle.getActiveConstraints().find(con => h.getConstraint() === con)) {
        // this constraint has been covered, so the candidate would conflict
        return false;
      }

      h = h.getRight();
    }
    while (h !== c.getFirstHit());

    // no conflicts were found
    return true;
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
    for (i = 1; i <= 9; i++) {
      if (!digits[i]) {
        digits[i] = this.isPossibleCandidate(row, col, i, solution);
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

  // return the toggled candidate if the action was successful, else undefined
  toggleCandidate: function(row, col, digit) {
    if (this.solution.has(Candidate.makeCellId(row, col)) ||
        this.hints.has(Candidate.makeCellId(row, col))) {
      console.log("Attempted to toggle candidate " + digit +
                 " in hinted cell at row " + row + ", col " + col);
      return;
    }

    // is it currently a candidate?
    var c = this.puzzle.findCandidate(row, col, digit);
    if (c !== undefined) {
      // yes, eliminate it from the puzzle
      if (!this.puzzle.eliminateCandidate(c)) {
        return;
      }

      // and update the candidates state if it succeeded
      this.candidates = this.candidates.delete(c.getName());

      return c;
    }
    else {
      c = this.puzzle.findEliminatedCandidate(row, col, digit);
      if (c === undefined) {
        console.log("Attempted to restore invalid candidate at row " +
             row + ", col " + col + ", digit " + digit);
        return;
      }

      // add it back into the puzzle
      if (!this.puzzle.manuallyAddCandidate(c)) {
        return;
      }

      // and update the candidates state
      this.candidates = this.candidates.set(c.getName(), c);
      return c;
    }
  },

  solveCell: function(hit) {
    var eliminatedCandidates = [];
    if (this.puzzle.solve(hit, eliminatedCandidates)) {
      this.solution = this.solution.set(
          hit.getCandidate().getCellId(),
          hit.getCandidate()
      );

      // update the candidates map
      var candidatesMutable = this.candidates.asMutable();
      eliminatedCandidates.forEach(c => candidatesMutable.delete(c.getName()));
      this.candidates = candidatesMutable.asImmutable();

      return eliminatedCandidates;
    }
  },

  // for backtracking/undo only - otherwise use puazle.manuallyRemoveSolution()
  unsolve: function() {
    var relinkedCandidates = [];
    var hit = this.puzzle.unsolve(relinkedCandidates);

    this.solution = this.solution.delete(hit.getCandidate().getCellId());

    var candidatesMutable = this.candidates.asMutable();
    relinkedCandidates.forEach(c => candidatesMutable.set(c.getName(), c));
    this.candidates = candidatesMutable.asImmutable();
  },

  onSetPuzzle: function(payload) {
    this.clearState();

    this.puzzle = payload.puzzle;

    this.candidates = Map(this.puzzle.getActiveCandidates()
        .map(c => { return [ c.getName(), c ]; } ));

    this.solution = Map(this.puzzle.getSolution()
        .map(h => { return [ h.getCandidate().getCellId(), h.getCandidate() ]; } ));

    this.hints = Map(this.puzzle.getHints()
        .map(c => { return [ c.getCellId(), c ]; } ));

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

    this.undoStack.length = this.undoIndex;
    this.undoStack.push({
      actionType: sudokuActionTypes.TOGGLE_CANDIDATE,
      row: payload.row,
      col: payload.col,
      digit: payload.digit
    });
    this.undoIndex++;

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
    else {
      var eliminatedCandidates = this.solveCell(c.getFirstHit());

      this.undoStack.length = this.undoIndex;
      this.undoStack.push({
        actionType: sudokuActionTypes.SOLVE_CELL,
        solution: c,
        eliminatedCandidates: eliminatedCandidates
      });
      this.undoIndex++;

      this.buildSelectedCell();

      this.emit("change");
    }
  },

  onClearCell: function(payload) {
    // check if this is a hinted cell
    if (this.hints.has(Candidate.makeCellId(payload.row, payload.col))) {
      // can't clear a hinted cell, just ignore the click
      return;
    }

    // is this a solved cell?
    var solution = this.solution.get(Candidate.makeCellId(payload.row, payload.col));
    if (solution !== undefined) {
      // solved, so manually remove the solution
      if (!this.puzzle.manuallyRemoveSolution(solution)) {
        // if it failed, then just ignore the click
        return;
      }

      // and update the solution state
      this.solution = this.solution.delete(Candidate.makeCellId(payload.row, payload.col));
    }

    // toggle any eliminated candidates back into the cell
    var possibleCandidates = this.getPossibleCandidates(payload.row, payload.col);
    var addedCandidates = [];
    for (var digit = 1; digit <= 9; digit++) {
      if (possibleCandidates[digit]) {
        if (!this.candidates.find(c => c.getRow() === payload.row &&
                                       c.getCol() === payload.col &&
                                       c.getDigit() === digit
                                 )) {
          var addedCandidate = this.toggleCandidate(payload.row, payload.col, digit);
          if (!addedCandidate) {
            console.log("Could not toggle candidate " + digit +
                        " at row " + payload.row + ", col " + payload.col +
                         " during clear operation");
            // but carry on as best we can
          }
          else {
            addedCandidates.push(addedCandidate);
          }
        }
      }
    }

    this.undoStack.length = this.undoIndex;
    this.undoStack.push({
      actionType: sudokuActionTypes.CLEAR_CELL,
      originalSolution: solution,
      addedCandidates: addedCandidates
    });
    this.undoIndex++;

    this.buildSelectedCell();

    this.emit("change");
  },

  puzzleUndo: function() {
    if (this.undoIndex > 0) {
      this.undoIndex--;
      var action = this.undoStack[this.undoIndex];

      if (action.actionType === sudokuActionTypes.TOGGLE_CANDIDATE) {
        this.toggleCandidate(action.row, action.col, action.digit);
      }
      else if (action.actionType === sudokuActionTypes.SOLVE_CELL) {
        this.unsolve();
      }
      else if (action.actionType === sudokuActionTypes.CLEAR_CELL) {
        if (action.originalSolution !== undefined) {
          this.solveCell(action.originalSolution.getFirstHit());
        }
        else {
          action.addedCandidates.forEach(c => this.toggleCandidate(c.getRow(), c.getCol(), c.getDigit())); 
        }
      }
      else {
        console.log("Invalid undo action type " + action.actionType);
      }

      this.buildSelectedCell();

      this.emit("change");
    }
  },

  puzzleRedo: function() {
    if (this.undoIndex < this.undoStack.length) {
      var action = this.undoStack[this.undoIndex];
      this.undoIndex++;

      if (action.actionType === sudokuActionTypes.TOGGLE_CANDIDATE) {
        this.toggleCandidate(action.row, action.col, action.digit);
      }
      else if (action.actionType === sudokuActionTypes.SOLVE_CELL) {
        this.solveCell(action.solution.getFirstHit());
      }
      else if (action.actionType === sudokuActionTypes.CLEAR_CELL) {
        if (action.originalSolution !== undefined) {
          // remove the solution
          this.puzzle.manuallyRemoveSolution(action.originalSolution);

          // and update the solution state
          this.solution = this.solution.delete(action.originalSolution.getCellId());
        }

        // add the eliminated candidates back
        action.addedCandidates.forEach(c => this.toggleCandidate(c.getRow(), c.getCol(), c.getDigit())); 
      }
      else {
        console.log("Invalid redo action type " + action.actionType);
      }

      this.buildSelectedCell();

      this.emit("change");
    }
  }

});

module.exports = PuzzleStore;