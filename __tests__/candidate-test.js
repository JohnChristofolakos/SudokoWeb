jest.disableAutomock();

var Hit = require("../public/scripts/model/hit.js");
var Candidate = require("../public/scripts/model/candidate.js");
var Puzzle = require("../public/scripts/model/puzzle.js");
var puzzleSetup = require("../__tests__utils/puzzleSetup.js");

describe("candidate", () => {
  it("can be constructed", () => {
    var c = new Candidate(1, 2, 3, "3@A2");

    expect(c.getRow()).toBe(1);
    expect(c.getCol()).toBe(2);
    expect(c.getDigit()).toBe(3);
    expect(c.getNext()).toBe(c);
    expect(c.getPrev()).toBe(c);
    expect(c.getFirstHit()).toBeNull();
    expect(c.getLength()).toBe(0);
    expect(c.getNum()).toBe(0);
    expect(c.getName()).toBe("r1c2d3");
    expect(c.getDisplayName()).toBe("3@A2");
  });

  it("has a scope-safe constructor", () => {
    var c = Candidate(1, 2, 3, "3@A2");

    expect(c.getRow()).toBe(1);
    expect(c.getCol()).toBe(2);
    expect(c.getDigit()).toBe(3);
    expect(c.getNext()).toBe(c);
    expect(c.getPrev()).toBe(c);
    expect(c.getFirstHit()).toBeNull();
    expect(c.getLength()).toBe(0);
    expect(c.getNum()).toBe(0);
    expect(c.getName()).toBe("r1c2d3");
    expect(c.getDisplayName()).toBe("3@A2");
  });

  it("has a parameter-checked constructor", () => {
    var notEnough = function() {
      var c = new Candidate(1, 2, 3);
    };
    var tooMany = function() {
      var c = new Candidate(1, 2, 3, "3@A2", 5);
    };

    expect(notEnough).toThrow();
    expect(tooMany).toThrow();
  });

  it("can be linked into a candidate list", () => {
    var rootCandidate = new Candidate(0,0, 0, "root");
    var c1 = new Candidate(1, 2, 3, "3@A2");
    var c2 = new Candidate(4, 5, 6, "6@D5");
    c1.addToCandidateList(rootCandidate);
    c2.addToCandidateList(rootCandidate);

    expect(rootCandidate.getNext()).toBe(c1);
    expect(rootCandidate.getPrev()).toBe(c2);
    expect(c1.getNext()).toBe(c2);
    expect(c1.getPrev()).toBe(rootCandidate);
    expect(c2.getNext()).toBe(rootCandidate);
    expect(c2.getPrev()).toBe(c1);
    expect(c1.getNum()).toBe(1);
    expect(c2.getNum()).toBe(2);
  });

  it("can be unlinked from a candidate list", () => {
    var rootHead = new Hit();
    var rootCandidate = new Candidate(0, 0, 0, "root");
    var c1 = new Candidate(1, 2, 3, "3@A2");
    var c2 = new Candidate(4, 5, 6, "6@D5");
    c1.addToCandidateList(rootCandidate);
    c2.addToCandidateList(rootCandidate);
    c1.unlinkFromCandidateList();

    expect(rootCandidate.getNext()).toBe(c2);
    expect(rootCandidate.getPrev()).toBe(c2);
    expect(c1.getNext()).toBe(c2);
    expect(c1.getPrev()).toBe(rootCandidate);
    expect(c2.getNext()).toBe(rootCandidate);
    expect(c2.getPrev()).toBe(rootCandidate);
  });

  it("can be relinked into a candidate list", () => {
    var rootHead = new Hit();
    var rootCandidate = new Candidate(0, 0, 0, "root");
    var c1 = new Candidate(1, 2, 3, "3@A2");
    var c2 = new Candidate(4, 5, 6, "6@D5");
    c1.addToCandidateList(rootCandidate);
    c2.addToCandidateList(rootCandidate);
    c1.unlinkFromCandidateList();
    c1.relinkIntoCandidateList();

    expect(rootCandidate.getNext()).toBe(c1);
    expect(rootCandidate.getPrev()).toBe(c2);
    expect(c1.getNext()).toBe(c2);
    expect(c1.getPrev()).toBe(rootCandidate);
    expect(c2.getNext()).toBe(rootCandidate);
    expect(c2.getPrev()).toBe(c1);
  });

  it("can have hits linked to it", () => {
    var candidate = new Candidate(0, 0, 0, "root");
    var h1 = new Hit();
    var h2 = new Hit();
    var h3 = new Hit();
    candidate.addHit(h1);
    candidate.addHit(h2);
    candidate.addHit(h3);

    expect(candidate.getFirstHit()).toBe(h1);
    expect(candidate.getLength()).toBe(3);

    expect(h1.getCandidate()).toBe(candidate);
    expect(h1.getRight()).toBe(h2);
    expect(h1.getLeft()).toBe(h3);

    expect(h2.getCandidate()).toBe(candidate);
    expect(h2.getRight()).toBe(h3);
    expect(h2.getLeft()).toBe(h1);

    expect(h3.getCandidate()).toBe(candidate);
    expect(h3.getRight()).toBe(h1);
    expect(h3.getLeft()).toBe(h2);
  });

  it("has a diagnostic toString()", () => {
    var c = new Candidate(1, 2, 3, "3@A2");
    expect(c.toString()).toBe("r1c2d3: no hits");

    var puzzle = new Puzzle();
    puzzleSetup.setupWithNoBoxes(puzzle, 2);

    expect(puzzle.findCandidate("r0c0d1").toString()).toBe(
          "r0c0d1: p00 r01 c01 ");
  });

  it("can perform various set operations on its hits", () => {
    var puzzle = new Puzzle();
    puzzleSetup.setupWithNoBoxes(puzzle, 2);

    // these two candidates both hit the constraint '1 in row 0'
    var c = puzzle.findCandidate("r0c0d1")
                      .sharedHits(puzzle.findCandidate("r0c1d1"));
    expect(c.getFirstHit().getConstraint().getName()).toBe("r01");

    // do it the other way round just for the coverage - should be the same result
    c = puzzle.findCandidate("r0c1d1")
                      .sharedHits(puzzle.findCandidate("r0c0d1"));
    expect(c.getFirstHit().getConstraint().getName()).toBe("r01");
   
    // these two candidates do not hit each other
    c = puzzle.findCandidate("r0c0d1")
                      .sharedHits(puzzle.findCandidate("r1c1d1"));
    expect(c.getLength()).toBe(0);

    // again, do it the other way round for the coverage
    c = puzzle.findCandidate("r0c1d1")
                      .sharedHits(puzzle.findCandidate("r1c0d1"));
    expect(c.getLength()).toBe(0);

    // these two candidates both hit the constraint '2 in col 1'
    var hits = puzzle.findCandidate("r0c1d2")
                      .hits(puzzle.findCandidate("r1c1d2"));
    expect(hits).toBe(true);

    // these two candidates do not hit each other
    hits = puzzle.findCandidate("r0c0d1")
                      .hits(puzzle.findCandidate("r1c1d1"));
    expect(hits).toBe(false);

    // these candidates share a common constraint - 1 in row 2
    puzzle = new Puzzle();
    puzzleSetup.setupWithNoBoxes(puzzle, 3);
    var hit = puzzle.findCandidate("r2c0d1").findCommonConstraint(
                puzzle.findCandidate("r2c1d1"),
                puzzle.findCandidate("r2c2d1")
              );
    expect(hit.getConstraint().getName()).toBe("r21");

    // these candidates do not share a common constraint
    hit = puzzle.findCandidate("r2c0d1").findCommonConstraint(
                puzzle.findCandidate("r2c1d1"),
                puzzle.findCandidate("r2c2d2")
              );
    expect(hit).toBeNull();

    // again, shuffle the combination to get a little more coverage
    hit = puzzle.findCandidate("r2c2d2").findCommonConstraint(
                puzzle.findCandidate("r2c1d1"),
                puzzle.findCandidate("r2c0d1")
              );
    expect(hit).toBeNull();
  });
  
});