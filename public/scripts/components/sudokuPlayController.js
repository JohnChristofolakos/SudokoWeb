var React = require("react");
var Fluxxor = require("fluxxor");
var classNames = require("classnames");

var { EntryMode } = require("../stores/playControllerStore.js");

var ControllerDigit = React.createClass({
  propTypes: {
    digit: React.PropTypes.number.isRequired,
    enabled: React.PropTypes.bool.isRequired,
    selected: React.PropTypes.bool.isRequired,
    onDigitClicked: React.PropTypes.func.isRequired
  },

  mixins: [
    Fluxxor.FluxMixin(React)
  ],

  render: function() {
    var buttonClass = classNames({
      controllerButton: true,
      controllerButtonEnabled: this.props.enabled,
      controllerButtonSelected: this.props.selected,
      controllerButtonDisabled: !this.props.enabled
    });
    var digitClass = classNames({
      controllerDigit: true,
      controllerDigitEnabled: this.props.enabled,
      controllerDigitSelected: this.props.selected,
      controllerDigitDisabled: !this.props.enabled
    });

    return (
      <td>
        <div className={buttonClass} onClick={this.onDigitClicked}>
          <div className={digitClass}>{this.props.digit}</div>
        </div>
      </td>
    );
  },

  onDigitClicked: function() {
    this.props.onDigitClicked(this.props.digit);
  }

});

var ControllerFrame = React.createClass({
  propTypes: {
    digitsEnabled: React.PropTypes.arrayOf(React.PropTypes.bool).isRequired,
    digitSelected: React.PropTypes.number.isRequired,
    entryMode: React.PropTypes.string.isRequired,
    digitMode: React.PropTypes.string.isRequired,
    onDigitClicked: React.PropTypes.func.isRequired
  },

  render: function() {
    var digits = [];
    for (var i = 1; i <= 9; i++) {
      digits[i] = <ControllerDigit
          digit={i}
          enabled={this.props.digitsEnabled[i]}
          selected={this.props.digitSelected === i}
          onDigitClicked={this.props.onDigitClicked}
        />;
    }

    return (
      <div className="controllerFrame">
        <table><tbody>
          <tr>{digits[1]}{digits[2]}{digits[3]}</tr>
          <tr>{digits[4]}{digits[5]}{digits[6]}</tr>
          <tr>{digits[7]}{digits[8]}{digits[9]}</tr>
        </tbody></table>
      </div>
    );
  }
});

var SudokuPlayController = React.createClass({
  propTypes: {
  },

  mixins: [
    Fluxxor.FluxMixin(React),
    Fluxxor.StoreWatchMixin("PuzzleStore")
  ],

  getInitialState: function() {
    return {
    };
  },

  getStateFromFlux: function() {
    var flux = this.getFlux();
    return {
      playControllerStore: flux.store("PlayControllerStore").getState(),
      puzzleStore: flux.store("PuzzleStore").getState()
    };
  },

  render: function() {
    var digitsEnabled = [];
    for (var i = 1; i <= 9; i++) {
      digitsEnabled[i] = false;
    }
    if (this.state.playControllerStore.entryMode === EntryMode.CELL_SELECTED) {
      this.state.puzzleStore.candidates.forEach( (c) => {
        if (c.getRow() === this.state.playControllerStore.cellRowSelected &&
            c.getCol() === this.state.playControllerStore.cellColSelected) {
          digitsEnabled[c.getDigit()] = true;
        }
      });
    } else {
      this.state.puzzleStore.candidates.forEach( (c) => { digitsEnabled[c.getDigit()] = true; });
    }

    return (
        <ControllerFrame
          digitsEnabled={digitsEnabled}
          digitSelected={this.state.playControllerStore.digitSelected}
          entryMode={this.state.playControllerStore.entryMode}
          digitMode={this.state.playControllerStore.digitMode}
          onDigitClicked={this.onDigitClicked}
        />
    );
  },

  onDigitClicked: function(digit) {
    console.log("Digit clicked: " + digit);
  },

  onCellClicked: function(row, col) {
    console.log("Cell clicked at " + row + ", " + col);
  }

});

module.exports = SudokuPlayController;