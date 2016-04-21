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
        <div className={buttonClass} onClick={this.onDigitClicked} padding="5px">
          <div className={digitClass}>
            {this.props.digit}
          </div>
        </div>
      </td>
    );
  },

  onDigitClicked: function() {
    if (this.props.enabled) {
      this.props.onDigitClicked(this.props.digit);
    }
  }

});

var ControllerButton = React.createClass({
  propTypes: {
    iconName: React.PropTypes.string.isRequired,
    enabled: React.PropTypes.bool.isRequired,
    selected: React.PropTypes.bool.isRequired,
    onButtonClicked: React.PropTypes.func.isRequired
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
    var iconClass = classNames({
      controllerIcon: true,
      controllerIconEnabled: this.props.enabled,
      controllerIconSelected: this.props.selected,
      controllerIconDisabled: !this.props.enabled,
      "material-icons": true,
      "md-36": true
    });

    return (
      <td>
        <div className={buttonClass} onClick={this.onButtonClicked} padding="5px">
          <i className={iconClass}>{this.props.iconName}</i>
        </div>
      </td>
    );
  },

  onButtonClicked: function() {
    if (this.props.enabled) {
      this.props.onButtonClicked(this.props.iconName);
    }
  }

});

var ControllerFrame = React.createClass({
  propTypes: {
    digitsEnabled: React.PropTypes.arrayOf(React.PropTypes.bool).isRequired,
    digitSelected: React.PropTypes.number.isRequired,
    entryMode: React.PropTypes.string.isRequired,
    digitMode: React.PropTypes.string.isRequired,
    onDigitClicked: React.PropTypes.func.isRequired,
    onButtonClicked: React.PropTypes.func.isRequired
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

    var tableStyle = {
      borderCollapse: "separate",
      borderSpacing: "6px"
    };

    return (
      <div className="controllerFrame">
        <table style={tableStyle}>
          <tbody>
            <tr>{digits[1]}{digits[2]}{digits[3]}</tr>
            <tr>{digits[4]}{digits[5]}{digits[6]}</tr>
            <tr>{digits[7]}{digits[8]}{digits[9]}</tr>
            <tr>
              <ControllerButton iconName="create"
                                enabled={true}
                                selected={false}
                                onButtonClicked={this.props.onButtonClicked} />
              <ControllerButton iconName="undo"
                                enabled={true}
                                selected={false}
                                onButtonClicked={this.props.onButtonClicked} />
              <ControllerButton iconName="done"
                                enabled={true}
                                selected={false}
                                onButtonClicked={this.props.onButtonClicked} />
            </tr>
            <tr>
              <ControllerButton iconName="clear"
                                enabled={true}
                                selected={false}
                                onButtonClicked={this.props.onButtonClicked} />
              <ControllerButton iconName="redo"
                                enabled={true}
                                selected={false}
                                onButtonClicked={this.props.onButtonClicked} />
              <ControllerButton iconName="pause"
                                enabled={true}
                                selected={false}
                                onButtonClicked={this.props.onButtonClicked} />
            </tr>
          </tbody>
        </table>
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
    if (this.state.playControllerStore.entryMode === EntryMode.CELL_SELECTED) {
      for (var i = 1; i <= 9; i++) {
        digitsEnabled[i] = true;
      }
    } else {
      // only enable digits that have not been completely solved yet
      for (i = 1; i <= 9; i++) {
        digitsEnabled[i] = false;
      }
      this.state.puzzleStore.candidates.forEach( (c) => { digitsEnabled[c.getDigit()] = true; });
    }

    return (
        <ControllerFrame
          digitsEnabled={digitsEnabled}
          digitSelected={this.state.playControllerStore.digitSelected}
          entryMode={this.state.playControllerStore.entryMode}
          digitMode={this.state.playControllerStore.digitMode}
          onDigitClicked={this.onDigitClicked}
          onButtonClicked={this.onButtonClicked}
        />
    );
  },

  onDigitClicked: function(digit) {
    console.log("Digit clicked: " + digit);
  },

  onCellClicked: function(row, col) {
    console.log("Cell clicked at " + row + ", " + col);
  },

  onButtonClicked: function(iconName) {
    console.log("Button clicked: " + iconName);
  }

});

module.exports = SudokuPlayController;