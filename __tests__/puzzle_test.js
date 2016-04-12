jest.disableAutomock();

var Hit = require("../public/scripts/model/hit.js");
var Candidate = require("../public/scripts/model/candidate.js");
var Puzzle = require("../public/scripts/model/puzzle.js");
var puzzleSetup = require("../__tests__utils/puzzleSetup.js");

describe("puzzle", () => {
  it("can be constructed", () => {
    var puzzle = new Puzzle();

    expect(puzzle).not.toBeNull();
    expect(puzzle).not.toBeUndefined();
    expect(puzzle.getRootConstraint()).not.toBeNull();
    expect(puzzle.getRootConstraint()).not.toBeUndefined();
    expect(puzzle.getConstraintCount()).toBe(0);
    expect(puzzle.getRootCandidate()).not.toBeNull();
    expect(puzzle.getRootCandidate()).not.toBeUndefined();
    expect(puzzle.getCandidateCount()).toBe(0);
    expect(puzzle.getHints().length).toBe(0);
    expect(puzzle.getSolution().length).toBe(0);
  });

  it("has a scope-safe constructor", () => {
    var puzzle = Puzzle();

    expect(puzzle).not.toBeNull();
    expect(puzzle).not.toBeUndefined();
    expect(puzzle.getRootConstraint()).not.toBeNull();
    expect(puzzle.getRootConstraint()).not.toBeUndefined();
    expect(puzzle.getConstraintCount()).toBe(0);
    expect(puzzle.getRootCandidate()).not.toBeNull();
    expect(puzzle.getRootCandidate()).not.toBeUndefined();
    expect(puzzle.getCandidateCount()).toBe(0);
    expect(puzzle.getHints().length).toBe(0);
    expect(puzzle.getSolution().length).toBe(0);
  });

  it("has a parameter-checked constructor", () => {
    var tooMany = function() {
      return new Puzzle(1);
    };
    expect(tooMany).toThrow();
  });

  it("can be initialised", () => {
    var puzzle = new Puzzle();
    puzzleSetup.setupWithNoBoxes(puzzle, 2);

    expect(puzzle.getConstraintCount()).toBe(12);
    expect(puzzle.getCandidateCount()).toBe(8);

    var constraints = puzzle.getActiveConstraints();
    expect(constraints.length).toBe(12);
    var constraintNames = constraints.map(c => c.getName());
    expect(constraintNames).toContain("p00");
    expect(constraintNames).toContain("p01");
    expect(constraintNames).toContain("p10");
    expect(constraintNames).toContain("p11");
    expect(constraintNames).toContain("r01");
    expect(constraintNames).toContain("r02");
    expect(constraintNames).toContain("r11");
    expect(constraintNames).toContain("r12");
    expect(constraintNames).toContain("c01");
    expect(constraintNames).toContain("c02");
    expect(constraintNames).toContain("c11");
    expect(constraintNames).toContain("c12");

    var candidates = puzzle.getActiveCandidates();
    expect(candidates.length).toBe(8);
    var candidateNames = candidates.map(c => c.getName());
    expect(candidateNames).toContain("r0c0d1");
    expect(candidateNames).toContain("r0c0d2");
    expect(candidateNames).toContain("r0c1d1");
    expect(candidateNames).toContain("r0c1d2");
    expect(candidateNames).toContain("r1c0d1");
    expect(candidateNames).toContain("r1c0d2");
    expect(candidateNames).toContain("r1c1d1");
    expect(candidateNames).toContain("r1c1d2");

    expect(puzzle.isSolved()).toBe(false);
    expect(puzzle.isBlocked()).toBe(false);
  });

  it("indicates when a candidate or constraint cannot be found", () => {
    var puzzle = new Puzzle();
    puzzleSetup.setupWithNoBoxes(puzzle, 2);
    expect(puzzle.findCandidate("xyz")).toBeUndefined();
    expect(puzzle.findConstraint("xyz")).toBeUndefined();
  });

  it("catches bad parm types passed to to the mutating routines", () => {
    var puzzle = new Puzzle();
    var hit = new Hit();
    var candidate = new Candidate(0, 0, 0, "root");

    function badParmToUnlinkCandidate() {
      puzzle._unlinkCandidate(hit);
    }
    expect(badParmToUnlinkCandidate).toThrow();

    function badParmToRelinkCandidate() {
      puzzle._relinkCandidate(hit);
    }
    expect(badParmToRelinkCandidate).toThrow();
    
    function badParmToCover() {
      puzzle.cover(1, hit);
    }
    expect(badParmToCover).toThrow();
    
    function badParmToUncover() {
      puzzle.uncover(hit);
    }
    expect(badParmToUncover).toThrow();
    
    function badParmToCoverHitConstraints() {
      puzzle.coverHitConstraints(0, candidate);
    }
    expect(badParmToCoverHitConstraints).toThrow();
    
    function badParmToUncoverHitConstraints() {
      puzzle.uncoverHitConstraints(candidate);
    }
    expect(badParmToUncoverHitConstraints).toThrow();
    
    function badParmToEliminateCandidate() {
      puzzle.eliminateCandidate(candidate);   // yes, odd, to be refactored
    }
    expect(badParmToEliminateCandidate).toThrow();
    
    function badParmToRestoreCandidate() {
      puzzle.restoreCandidate(candidate);     // also odd, to be refactored
    }
    expect(badParmToRestoreCandidate).toThrow();
    
    function badParmToPushSolution() {
      puzzle.pushSolution(candidate);
    }
    expect(badParmToPushSolution).toThrow();
    
    function badParmToSolve() {
      puzzle.solve(0, candidate);
    }
    expect(badParmToSolve).toThrow();
  });

  it("can have hints applied", () => {
    var puzzle = new Puzzle();
    puzzleSetup.setupWithNoBoxes(puzzle, 2);

    expect(puzzle.getConstraintCount()).toBe(12);
    expect(puzzle.getCandidateCount()).toBe(8);

    puzzle.addHint("r0c0d1");
    expect(puzzle.getConstraintCount()).toBe(9);
    expect(puzzle.getCandidateCount()).toBe(4);
    
    var hints = puzzle.getHints();
    expect(hints.length).toBe(1);
    var hintNames = hints.map(c => c.getName());
    expect(hintNames).toContain("r0c0d1");

    var constraints = puzzle.getActiveConstraints();
    expect(constraints.length).toBe(9);
    var constraintNames = constraints.map(c => c.getName());
    expect(constraintNames).toContain("p01");
    expect(constraintNames).toContain("p10");
    expect(constraintNames).toContain("p11");
    expect(constraintNames).toContain("r02");
    expect(constraintNames).toContain("r11");
    expect(constraintNames).toContain("r12");
    expect(constraintNames).toContain("c02");
    expect(constraintNames).toContain("c11");
    expect(constraintNames).toContain("c12");


    var candidates = puzzle.getActiveCandidates();
    expect(candidates.length).toBe(4);
    var candidateNames = candidates.map(c => c.getName());
    expect(candidateNames).toContain("r0c1d2");
    expect(candidateNames).toContain("r1c0d2");
    expect(candidateNames).toContain("r1c1d1");
    expect(candidateNames).toContain("r1c1d2");

    expect(puzzle.isSolved()).toBe(false);
    expect(puzzle.isBlocked()).toBe(false);

    // while we're here, check getActiveConstraints with a length filter
    // several constraints should now only have 1 possible candidate each
    constraints = puzzle.getActiveConstraints(1);
    expect(constraints.length).toBe(6);
    constraintNames = constraints.map(c => c.getName());
    expect(constraintNames).toContain("p01");
    expect(constraintNames).toContain("p10");
    expect(constraintNames).toContain("r02");
    expect(constraintNames).toContain("r11");
    expect(constraintNames).toContain("c02");
    expect(constraintNames).toContain("c11");
  });

  it ("can be solved", () => {
    var puzzle = new Puzzle();
    puzzleSetup.setupWithNoBoxes(puzzle, 2);

    expect(puzzle.getConstraintCount()).toBe(12);
    expect(puzzle.getCandidateCount()).toBe(8);

    puzzle.solve(0, puzzle.findCandidate("r0c0d1").getFirstHit());
    puzzle.solve(0, puzzle.findCandidate("r0c1d2").getFirstHit());
    puzzle.solve(0, puzzle.findCandidate("r1c0d2").getFirstHit());
    puzzle.solve(0, puzzle.findCandidate("r1c1d1").getFirstHit());

    expect(puzzle.getConstraintCount()).toBe(0);
    expect(puzzle.getCandidateCount()).toBe(0);
    expect(puzzle.isSolved()).toBe(true);
    expect(puzzle.isBlocked()).toBe(false);
  });

  it ("can be unsolved", () => {
    var puzzle = new Puzzle();
    puzzleSetup.setupWithNoBoxes(puzzle, 2);
    expect(puzzle.getConstraintCount()).toBe(12);
    expect(puzzle.getCandidateCount()).toBe(8);

    puzzle.solve(0, puzzle.findCandidate("r0c0d1").getFirstHit());
    puzzle.solve(0, puzzle.findCandidate("r0c1d2").getFirstHit());
    puzzle.solve(0, puzzle.findCandidate("r1c0d2").getFirstHit());
    puzzle.solve(0, puzzle.findCandidate("r1c1d1").getFirstHit());
    expect(puzzle.isSolved()).toBe(true);

    puzzle.unsolve();
    puzzle.unsolve();
    puzzle.unsolve();
    puzzle.unsolve();

    expect(puzzle.getConstraintCount()).toBe(12);
    expect(puzzle.getCandidateCount()).toBe(8);

    var constraints = puzzle.getActiveConstraints();
    expect(constraints.length).toBe(12);
    var constraintNames = constraints.map(c => c.getName());
    expect(constraintNames).toContain("p00");
    expect(constraintNames).toContain("p01");
    expect(constraintNames).toContain("p10");
    expect(constraintNames).toContain("p11");
    expect(constraintNames).toContain("r01");
    expect(constraintNames).toContain("r02");
    expect(constraintNames).toContain("r11");
    expect(constraintNames).toContain("r12");
    expect(constraintNames).toContain("c01");
    expect(constraintNames).toContain("c02");
    expect(constraintNames).toContain("c11");
    expect(constraintNames).toContain("c12");

    var candidates = puzzle.getActiveCandidates();
    expect(candidates.length).toBe(8);
    var candidateNames = candidates.map(c => c.getName());
    expect(candidateNames).toContain("r0c0d1");
    expect(candidateNames).toContain("r0c0d2");
    expect(candidateNames).toContain("r0c1d1");
    expect(candidateNames).toContain("r0c1d2");
    expect(candidateNames).toContain("r1c0d1");
    expect(candidateNames).toContain("r1c0d2");
    expect(candidateNames).toContain("r1c1d1");
    expect(candidateNames).toContain("r1c1d2");

    expect(puzzle.isSolved()).toBe(false);
    expect(puzzle.isBlocked()).toBe(false);
  });

  it("can have candidates eliminated and restored", () => {
    var puzzle = new Puzzle();
    puzzleSetup.setupWithNoBoxes(puzzle, 2);
    expect(puzzle.getConstraintCount()).toBe(12);
    expect(puzzle.getCandidateCount()).toBe(8);

    var h1 = puzzle.findCandidate("r0c1d1").getFirstHit();
    puzzle.eliminateCandidate(h1);
    var h2 = puzzle.findCandidate("r0c1d2").getFirstHit();
    puzzle.eliminateCandidate(h2);

    expect(puzzle.isSolved()).toBe(false);
    expect(puzzle.isBlocked()).toBe(true);
    expect(puzzle.getCandidateCount()).toBe(6);

    var candidates = puzzle.getActiveCandidates();
    var candidateNames = candidates.map((c) => c.getName());
    expect(candidateNames).not.toContain("r0c1d1");
    expect(candidateNames).not.toContain("r0c1d2");

    puzzle.restoreCandidate(h2);
    puzzle.restoreCandidate(h1);

    expect(puzzle.isSolved()).toBe(false);
    expect(puzzle.isBlocked()).toBe(false);
    expect(puzzle.getCandidateCount()).toBe(8);

    candidates = puzzle.getActiveCandidates();
    candidateNames = candidates.map((c) => c.getName());
    expect(candidateNames).toContain("r0c1d1");
    expect(candidateNames).toContain("r0c1d2");
  });

  it("can be printed in unsolved form", () => {
    var puzzle = new Puzzle();
    puzzleSetup.setupWithNoBoxes(puzzle, 2);
    expect(puzzle.getConstraintCount()).toBe(12);
    expect(puzzle.getCandidateCount()).toBe(8);

    puzzle.addHint("r0c0d1");
    puzzle.solve(0, puzzle.findCandidate("r1c1d1").getFirstHit());

    var s = puzzle.toString();
    expect(s.substr(0, 52 * 8)).toBe(
      " *  |  2  |     |     |     |     |     |     |    \n" +
      "*1* |     |     |     |     |     |     |     |    \n" +
      " *  |     |     |     |     |     |     |     |    \n" +
      "----+-----+-----+-----+-----+-----+-----+-----+----\n" +
      " 2  |  +  |     |     |     |     |     |     |    \n" +
      "    | +1+ |     |     |     |     |     |     |    \n" +
      "    |  +  |     |     |     |     |     |     |    \n" +
      "----+-----+-----+-----+-----+-----+-----+-----+----\n"
    );
  });

  it("can be printed in solved form", () => {
    var puzzle = new Puzzle();
    puzzleSetup.setupWithNoBoxes(puzzle, 2);
    expect(puzzle.getConstraintCount()).toBe(12);
    expect(puzzle.getCandidateCount()).toBe(8);

    puzzle.solve(0, puzzle.findCandidate("r0c0d1").getFirstHit());
    puzzle.solve(0, puzzle.findCandidate("r0c1d2").getFirstHit());
    puzzle.solve(0, puzzle.findCandidate("r1c0d2").getFirstHit());
    puzzle.solve(0, puzzle.findCandidate("r1c1d1").getFirstHit());

    var s = puzzle.toString();
    expect(s.substr(0, 20)).toBe(
      "12       \n" +
      "21       \n"
    );
  });

});