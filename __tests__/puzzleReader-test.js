jest.disableAutomock();

var Puzzle = require("../public/scripts/model/puzzle.js");
var PuzzleReader = require("../public/scripts/io/puzzleReader.js");

function lineReader(rowNum) {
  var lines = [
    "2...41..6",
    "4..6.2.1.",
    ".16.9...4",
    "3..12964.",
    "142.6.59.",
    ".695.4..1",
    "584216379",
    "92.4.8165",
    "6.19..482"
  ];

  return lines[rowNum];
}

function candidateReaderEmpty() {
  return null;
}

function candidateReader(rowNum) {
  var candidateNames = [ "r0c1d7", "r2c7d2" ];

  if (rowNum >= candidateNames.length) {
    return null;
  } else {
    return candidateNames[rowNum];
  }
}

describe("puzzleReader", () => {
  it("can be constructed with 2 args", () => {
    var puzzleReader = new PuzzleReader(lineReader, candidateReader);
    expect(puzzleReader).not.toBeNull();
    expect(puzzleReader).not.toBeUndefined();
  });

  it("can be constructed with one arg", () => {
    var puzzleReader = new PuzzleReader(lineReader);
    expect(puzzleReader).not.toBeNull();
    expect(puzzleReader).not.toBeUndefined();
  });

  it("has a scope-safe constructor", () => {
    var puzzleReader = PuzzleReader(lineReader);
    expect(puzzleReader).not.toBeNull();
    expect(puzzleReader).not.toBeUndefined();
  });

  it("has a parameter-checked constructor", () => {
    var tooMany = function() {
      return new PuzzleReader(lineReader, candidateReader, 1);
    };
    expect(tooMany).toThrow();

    var notEnough = function() {
      return new PuzzleReader();
    };
    expect(notEnough).toThrow();
  });

  it("can read a puzzle", () => {
    var puzzleReader = new PuzzleReader(lineReader, candidateReaderEmpty);
    expect(puzzleReader).not.toBeNull();
    expect(puzzleReader).not.toBeUndefined();

    var puzzle = new Puzzle();
    puzzleReader.generate(puzzle);

    var hintNames = puzzle.getHints().map(c => c.getName());
    expect(hintNames.length).toBe(51);
    expect(hintNames).toContain("r0c0d2");
    expect(hintNames).toContain("r2c8d4");

    expect(puzzle.getSolution().length).toBe(0);

    var candidateNames = puzzle.getActiveCandidates().map(c => c.getName());
    expect(candidateNames).toContain("r0c1d7");
    expect(candidateNames).toContain("r2c7d2");
    expect(candidateNames).not.toContain("r0c1d1");
  });

  it("can read a puzzle with eliminated candidates", () => {
    var puzzleReader = new PuzzleReader(lineReader, candidateReader);
    expect(puzzleReader).not.toBeNull();
    expect(puzzleReader).not.toBeUndefined();

    var puzzle = new Puzzle();
    puzzleReader.generate(puzzle);

    var hintNames = puzzle.getHints().map(c => c.getName());
    expect(hintNames.length).toBe(51);
    expect(hintNames).toContain("r0c0d2");
    expect(hintNames).toContain("r2c8d4");

    expect(puzzle.getSolution().length).toBe(0);

    var candidateNames = puzzle.getActiveCandidates().map(c => c.getName());
    expect(candidateNames).not.toContain("r0c1d7");
    expect(candidateNames).not.toContain("r2c7d2");
    expect(candidateNames).not.toContain("r0c1d1");
  });

});
