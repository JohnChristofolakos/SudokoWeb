jest.disableAutomock();

var UnitTypes = require("../public/scripts/constants/sudokuConst.js").sudokuUnitTypes;
var Hit = require("../public/scripts/model/hit.js");
var Constraint = require("../public/scripts/model/constraint.js");
var Puzzle = require("../public/scripts/model/puzzle.js");
var puzzleSetup = require("../__tests__utils/puzzleSetup.js");

describe("hit", () => {
  it("can be constructed", () => {
    var hit = new Hit();
    expect(hit.getUp()).toBe(hit);
    expect(hit.getDown()).toBe(hit);
    expect(hit.getLeft()).toBe(hit);
    expect(hit.getRight()).toBe(hit);
    expect(hit.getConstraint()).toBeNull();
    expect(hit.getCandidate()).toBeNull();
  });

  it("has a copy constructor", () => {
      var c = new Constraint(new Hit(), "test", UnitTypes.BOX, "unit");
      var h1 = new Hit();
      h1.addToConstraint(c);
      
      var h2 = new Hit(h1);
      expect(h2.getConstraint()).toBe(h1.getConstraint());
  });

  it("has a scope-safe constructor", () => {
    var hit = Hit();
    expect(hit.getUp()).toBe(hit);
    expect(hit.getDown()).toBe(hit);
    expect(hit.getLeft()).toBe(hit);
    expect(hit.getRight()).toBe(hit);
    expect(hit.getConstraint()).toBeNull();
    expect(hit.getCandidate()).toBeNull();
  });

  it("has a parameter-checked constructor", () => {
    var tooMany = function() {
      var hit = new Hit(1, 2);
    };
    expect(tooMany).toThrow();
  });

  it("has a toString() override for logging", () => {
    var puzzle = new Puzzle();
    puzzleSetup.setupWithNoBoxes(puzzle, 2);

    var c = puzzle.findCandidate("r0c0d1");
    var s = c.getFirstHit().toString();
    expect(s).toBe("r0c0d1: p00 r01 c01 (1 of 2)");

    puzzle.eliminateCandidate(c.getFirstHit());
    s = c.getFirstHit().toString();
    expect(s).toBe("r0c0d1: p00 r01 c01 (not in its constraint)");

    // just for coverage
    var h = new Hit();
    console.log(h.toString());
    expect(h.toString()).toBe("unlinked");
  });

  it("has a displayable name", () => {
    var puzzle = new Puzzle();
    puzzleSetup.setupWithNoBoxes(puzzle, 2);

    var c = puzzle.findCandidate("r0c0d1");
    var s = c.getFirstHit().getDisplayName();
    expect(s).toBe("1 in cell A1");

    // display name should work even after being eliminated
    puzzle.eliminateCandidate(c.getFirstHit());
    s = c.getFirstHit().getDisplayName();
    expect(s).toBe("1 in cell A1");

    // just for coverage
    var h = new Hit();
    console.log(h.getDisplayName());
    expect(h.getDisplayName()).toBe("??? in ???");
  });
});