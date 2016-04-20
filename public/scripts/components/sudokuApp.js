var React = require("react");
var Fluxxor = require("fluxxor");

var SudokuGrid = require("./sudokuGrid.js");
var SudokuPlayController = require("./sudokuPlayController.js");

var SudokuApp = React.createClass({
  propTypes: {
    flux: React.PropTypes.object.isRequired
  },

  mixins: [
    Fluxxor.FluxMixin(React)
  ],


  render: function() {
    return (
      <div className="sudokuApp">
          <SudokuGrid onCellClicked={this.onCellClicked}/>
          <SudokuPlayController ref="playController"/>
      </div>
    );
  },

  onCellClicked: function(row, col) {
    this.refs.playController.onCellClicked(row, col);
  }

});

module.exports = SudokuApp;