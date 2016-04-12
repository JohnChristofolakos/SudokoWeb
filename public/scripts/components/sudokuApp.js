var React = require("react");
var SudokuGrid = require("./sudokuGrid.js");

var SudokuApp = React.createClass({
  propTypes: {
    flux: React.PropTypes.object.isRequired
  },

  render: function() {
    return (
      <div>
        <SudokuGrid flux={this.props.flux} />
      </div>
    );
  }
});

module.exports = SudokuApp;