jest.disableAutomock();

var UnitTypes = require("../public/scripts/constants/sudokuConst.js").sudokuUnitTypes;
var Hit = require("../public/scripts/model/hit.js");
var Constraint = require("../public/scripts/model/constraint.js");
var Puzzle = require("../public/scripts/model/puzzle.js");
var puzzleSetup = require("../__tests__utils/puzzleSetup.js");

describe("constraint", () => {
  it("can be constructed", () => {
    var head = new Hit();
    var c = new Constraint(head, "test", UnitTypes.BOX, "unit");

    expect(c.getHead()).toBe(head);
    expect(c.getName()).toBe("test");
    expect(c.getUnitType()).toBe(UnitTypes.BOX);
    expect(c.getUnitName()).toBe("unit");
    expect(c.getLength()).toBe(0);
    expect(c.getPrev()).toBe(c);
    expect(c.getNext()).toBe(c);

    expect(c.getHead().getConstraint()).toBe(c);
    expect(c.getHead().getCandidate()).toBeNull();
    expect(c.getHead().getUp()).toBe(c.getHead());
    expect(c.getHead().getDown()).toBe(c.getHead());
    expect(c.getHead().getLeft()).toBe(c.getHead());
    expect(c.getHead().getRight()).toBe(c.getHead());
  });

  it("nas a scope-safe constructor", () => {
    var head = new Hit();
    var c = Constraint(head, "test", UnitTypes.BOX, "unit");

    expect(c.getHead()).toBe(head);
    expect(c.getName()).toBe("test");
    expect(c.getUnitType()).toBe(UnitTypes.BOX);
    expect(c.getUnitName()).toBe("unit");
    expect(c.getLength()).toBe(0);
    expect(c.getPrev()).toBe(c);
    expect(c.getNext()).toBe(c);

    expect(c.getHead().getConstraint()).toBe(c);
    expect(c.getHead().getCandidate()).toBeNull();
    expect(c.getHead().getUp()).toBe(c.getHead());
    expect(c.getHead().getDown()).toBe(c.getHead());
    expect(c.getHead().getLeft()).toBe(c.getHead());
    expect(c.getHead().getRight()).toBe(c.getHead());
  });

  it("has a parameter-checked constructor", () => {
    var notEnough = function() {
      return new Constraint(new Hit(), "test", UnitTypes.BOX);
    };
    var tooMany = function() {
      return new Constraint(new Hit(), "test", UnitTypes.BOX, "unit", 1);
    };

    expect(notEnough).toThrow();
    expect(tooMany).toThrow();
  });

  it("can be linked into a constraint list", () => {
    var rootHead = new Hit();
    var rootConstraint = new Constraint(rootHead, "", UnitTypes.ROOT, "root");
    var h1 = new Hit();
    var h2 = new Hit();
    var c1 = new Constraint(h1, "c1", UnitTypes.COLUMN, "col 1");
    var c2 = new Constraint(h2, "r1", UnitTypes.ROW, "row 1");
    c1.addToConstraintList(rootConstraint);
    c2.addToConstraintList(rootConstraint);

    expect(rootConstraint.getNext()).toBe(c1);
    expect(rootConstraint.getPrev()).toBe(c2);
    expect(c1.getNext()).toBe(c2);
    expect(c1.getPrev()).toBe(rootConstraint);
    expect(c2.getNext()).toBe(rootConstraint);
    expect(c2.getPrev()).toBe(c1);
    expect(c1.getNum()).toBe(1);
    expect(c2.getNum()).toBe(2);
  });

  it("can be unlinked from a constraint list", () => {
    var rootHead = new Hit();
    var rootConstraint = new Constraint(rootHead, "", UnitTypes.ROOT, "root");
    var h1 = new Hit();
    var h2 = new Hit();
    var c1 = new Constraint(h1, "c1", UnitTypes.COLUMN, "col 1");
    var c2 = new Constraint(h2, "r1", UnitTypes.ROW, "row 1");
    c1.addToConstraintList(rootConstraint);
    c2.addToConstraintList(rootConstraint);
    c1.unlinkFromConstraintList();

    expect(rootConstraint.getNext()).toBe(c2);
    expect(rootConstraint.getPrev()).toBe(c2);
    expect(c1.getNext()).toBe(c2);
    expect(c1.getPrev()).toBe(rootConstraint);
    expect(c2.getNext()).toBe(rootConstraint);
    expect(c2.getPrev()).toBe(rootConstraint);
  });

  it("can be relinked into a constraint list", () => {
    var rootHead = new Hit();
    var rootConstraint = new Constraint(rootHead, "", UnitTypes.ROOT, "root");
    var h1 = new Hit();
    var h2 = new Hit();
    var c1 = new Constraint(h1, "c1", UnitTypes.COLUMN, "col 1");
    var c2 = new Constraint(h2, "r1", UnitTypes.ROW, "row 1");
    c1.addToConstraintList(rootConstraint);
    c2.addToConstraintList(rootConstraint);
    c1.unlinkFromConstraintList();
    c1.relinkIntoConstraintList();

    expect(rootConstraint.getNext()).toBe(c1);
    expect(rootConstraint.getPrev()).toBe(c2);
    expect(c1.getNext()).toBe(c2);
    expect(c1.getPrev()).toBe(rootConstraint);
    expect(c2.getNext()).toBe(rootConstraint);
    expect(c2.getPrev()).toBe(c1);
  });

  it("can have hits linked to it", () => {
    var head = new Hit();
    var constraint = new Constraint(head, "test", UnitTypes.BOX, "unit");
    var h1 = new Hit();
    var h2 = new Hit();
    constraint.addHit(h1);
    constraint.addHit(h2);

    expect(constraint.getHead().getDown()).toBe(h1);
    expect(constraint.getHead().getUp()).toBe(h2);
    expect(constraint.getLength()).toBe(2);

    expect(h1.getConstraint()).toBe(constraint);
    expect(h1.getUp()).toBe(constraint.getHead());
    expect(h1.getDown()).toBe(h2);

    expect(h2.getConstraint()).toBe(constraint);
    expect(h2.getUp()).toBe(h1);
    expect(h2.getDown()).toBe(constraint.getHead());
  });

  it("can have hits unlinked from it", () => {
    var head = new Hit();
    var constraint = new Constraint(head, "test", UnitTypes.BOX, "unit");
    var h1 = new Hit();
    var h2 = new Hit();
    constraint.addHit(h1);
    constraint.addHit(h2);
    constraint.unlinkHit(h1);

    expect(constraint.getHead().getDown()).toBe(h2);
    expect(constraint.getHead().getUp()).toBe(h2);
    expect(constraint.getLength()).toBe(1);

    expect(h1.getConstraint()).toBe(constraint);
    expect(h1.getUp()).toBe(constraint.getHead());
    expect(h1.getDown()).toBe(h2);

    expect(h2.getConstraint()).toBe(constraint);
    expect(h2.getUp()).toBe(constraint.getHead());
    expect(h2.getDown()).toBe(constraint.getHead());
  });

  it("can have hits relinked to it", () => {
    var head = new Hit();
    var constraint = new Constraint(head, "test", UnitTypes.BOX, "unit");
    var h1 = new Hit();
    var h2 = new Hit();
    constraint.addHit(h1);
    constraint.addHit(h2);
    constraint.unlinkHit(h1);
    constraint.relinkHit(h1);

    expect(constraint.getHead().getDown()).toBe(h1);
    expect(constraint.getHead().getUp()).toBe(h2);
    expect(constraint.getLength()).toBe(2);

    expect(h1.getConstraint()).toBe(constraint);
    expect(h1.getUp()).toBe(constraint.getHead());
    expect(h1.getDown()).toBe(h2);

    expect(h2.getConstraint()).toBe(constraint);
    expect(h2.getUp()).toBe(h1);
    expect(h2.getDown()).toBe(constraint.getHead());
  });

  it("can check if its hits are a subset of another constraint's hits", () => {
    var puzzle = new Puzzle();
    puzzleSetup.setupWithBoxes(puzzle, 2);

    // remove the 2's from r0c0 amd r0c1
    var h1 = puzzle.findCandidate("r0c0d2").getFirstHit();
    var h2 = puzzle.findCandidate("r0c1d2").getFirstHit();
    puzzle.eliminateCandidate(h1);
    puzzle.eliminateCandidate(h2);

    // now the 2's in row 0 should be a strict subset of the 2's in box 1
    var isSubset = puzzle.findConstraint("r02").isStrictSubsetOf(puzzle.findConstraint("b12"));
    expect(isSubset).toBe(true);

    // but not the other way around
    isSubset = puzzle.findConstraint("b12").isStrictSubsetOf(puzzle.findConstraint("r02"));
    expect(isSubset).toBe(false);

    // once we remove the 2's from r1c2 and r1c3, they have the same hits
    var h3 = puzzle.findCandidate("r1c2d2").getFirstHit();
    var h4 = puzzle.findCandidate("r1c3d2").getFirstHit();
    puzzle.eliminateCandidate(h3);
    puzzle.eliminateCandidate(h4);
    isSubset = puzzle.findConstraint("r02").isStrictSubsetOf(puzzle.findConstraint("b12"));
    expect(isSubset).toBe(false);
    isSubset = puzzle.findConstraint("b12").isStrictSubsetOf(puzzle.findConstraint("r02"));
    expect(isSubset).toBe(false);
    isSubset = puzzle.findConstraint("r02").isSubsetOf(puzzle.findConstraint("b12"));
    expect(isSubset).toBe(true);
    isSubset = puzzle.findConstraint("r02").isSubsetOf(puzzle.findConstraint("b12"));
    expect(isSubset).toBe(true);

    // the 2's in row 0 have nothing to do with the 2's in box 2
    isSubset = puzzle.findConstraint("r02").isStrictSubsetOf(puzzle.findConstraint("b22"));
    expect(isSubset).toBe(false);

    // there are more 2 candidates in row 0 than row 1
    isSubset = puzzle.findConstraint("r02").isSubsetOf(puzzle.findConstraint("r12"));
  });

  it("can take the set difference between its hits and another constraint's hits", () => {
    var puzzle = new Puzzle();
    puzzleSetup.setupWithBoxes(puzzle, 2);

    // take the difference between candidate 1 in box 1 minus candidate 1 in row 0
    var hits = puzzle.findConstraint("b11").minus(puzzle.findConstraint("r01"));

    // we should get r1c2d1 and r1c3d1
    expect(hits.length).toBe(2);
    var candidateNames = hits.map(h => h.getCandidate().getName());
    expect(candidateNames).toContain("r1c2d1");
    expect(candidateNames).toContain("r1c3d1");
  });

  it("can determine which of its hits are shared with another constraint", () => {
    var puzzle = new Puzzle();
    puzzleSetup.setupWithBoxes(puzzle, 2);

    // find the hits shared between digit 2 in row 0 and box 1
    var hits = puzzle.findConstraint("r02").sharedHits(puzzle.findConstraint("b12"));

    // should be r0c2d2 and r0c3d2
    expect(hits.length).toBe(2);
    var candidateNames = hits.map(h => h.getCandidate().getName());
    expect(candidateNames).toContain("r0c2d2");
    expect(candidateNames).toContain("r0c3d2");

    // no shared hits for example between digit 1 in row 1 and row 2
    hits = puzzle.findConstraint("r11").sharedHits(puzzle.findConstraint("r21"));
    expect(hits.length).toBe(0);
  });

  it("can determine if any of its hits are shared with another constraint", () => {
    var puzzle = new Puzzle();
    puzzleSetup.setupWithBoxes(puzzle, 2);

    // are any hits shared between digit 1 in row 2 and box 3 - there should be
    var hits = puzzle.findConstraint("r21").hits(puzzle.findConstraint("b31"));
    expect(hits).toBe(true);

    // no shared hits for example between digit 2 in col 0 and col 2
    hits = puzzle.findConstraint("c02").hits(puzzle.findConstraint("c22"));
    expect(hits).toBe(false);
  });
});