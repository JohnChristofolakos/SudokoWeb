var React = require("react");
var SudokuGrid = require("./sudokuGrid.js");

var SudokuApp = React.createClass({
  render: function() {
    return (
      <div>
        <SudokuGrid />
      </div>
    );
  }
});

module.exports = SudokuApp;