var React = require("react");
var Fluxxor = require("fluxxor");
var classNames = require("classnames");

var { EntryMode, DigitMode } = require("../stores/playControllerStore.js");

var ControllerDigit = React.createClass({
  propTypes: {
    digit: React.PropTypes.number.isRequired,
    enabled: React.PropTypes.bool.isRequired,
    selected: React.PropTypes.bool.isRequired,
    selectedCandidate: React.PropTypes.bool.isRequired,
    onDigitClicked: React.PropTypes.func.isRequired
  },

  mixins: [
    Fluxxor.FluxMixin(React)
  ],

  render: function() {
    var buttonClass = classNames({
      controllerButton: true,
      controllerButtonEnabled: this.props.enabled,
      controllerButtonDisabled: !this.props.enabled,
      controllerButtonSelected: this.props.selected,
      controllerButtonSelectedCandidate: this.props.selectedCandidate
    });
    var digitClass = classNames({
      controllerDigit: true,
      controllerDigitEnabled: this.props.enabled,
      controllerDigitDisabled: !this.props.enabled,
      controllerDigitSelected: this.props.selected,
      controllerDigitSelectedCandidate: this.props.selectedCandidate
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
    selectedCandidate: React.PropTypes.bool.isRequired,
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
      controllerButtonSelectedCandidate: this.props.selectedCandidate,
      controllerButtonDisabled: !this.props.enabled
    });
    var iconClass = classNames({
      controllerIcon: true,
      controllerIconEnabled: this.props.enabled,
      controllerIconSelected: this.props.selected,
      controllerIconSelectedCandidate: this.props.selectedCandidate,
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
    digitSelected: React.PropTypes.number.isRequired,
    digitsEnabled: React.PropTypes.arrayOf(React.PropTypes.bool).isRequired,
    cellSelected: React.PropTypes.object.isRequired,
    entryMode: React.PropTypes.string.isRequired,
    digitMode: React.PropTypes.string.isRequired,
    onDigitClicked: React.PropTypes.func.isRequired,
    onButtonClicked: React.PropTypes.func.isRequired
  },

  render: function() {
    var digits = [];
    for (var i = 1; i <= 9; i++) {
      var selected = false, selectedCandidate = false;
      if (this.props.entryMode === EntryMode.CELL_SELECTED) {
        if ((this.props.cellSelected.isHinted || this.props.cellSelected.isSolved) &&
            this.props.cellSelected.candidates[0] === i &&
            this.props.digitMode === DigitMode.BIG_NUMBER) {
          selected = true;
        }
        if (!this.props.cellSelected.isHinted && !this.props.cellSelected.isSolved &&
            this.props.cellSelected.candidates.indexOf(i) >= 0 &&
            this.props.digitMode === DigitMode.CANDIDATE) {
          selectedCandidate = true;
        }
      }
      else {
        selected = this.props.digitMode === DigitMode.BIG_NUMBER &&
                   this.props.digitSelected === i;
        selectedCandidate = this.props.digitMode === DigitMode.CANDIDATE &&
                            this.props.digitSelected === i;
      }

      digits[i] = <ControllerDigit
          digit={i}
          enabled={this.props.digitsEnabled[i]}
          selected={selected}
          selectedCandidate={selectedCandidate}
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
            <tr style={{height: "10px"}}></tr>
            <tr>
              <ControllerButton iconName="create"
                                enabled={true}
                                selected={false}
                                selectedCandidate={this.props.digitMode === DigitMode.CANDIDATE}
                                onButtonClicked={this.props.onButtonClicked} />
              <ControllerButton iconName="undo"
                                enabled={false}
                                selected={false}
                                selectedCandidate={false}
                                onButtonClicked={this.props.onButtonClicked} />
              <ControllerButton iconName="done"
                                enabled={false}
                                selected={false}
                                selectedCandidate={false}
                                onButtonClicked={this.props.onButtonClicked} />
            </tr>
            <tr>
              <ControllerButton iconName="clear"
                                enabled={true}
                                selected={this.props.digitMode === DigitMode.CLEAR}
                                selectedCandidate={false}
                                onButtonClicked={this.props.onButtonClicked} />
              <ControllerButton iconName="redo"
                                enabled={false}
                                selected={false}
                                selectedCandidate={false}
                                onButtonClicked={this.props.onButtonClicked} />
              <ControllerButton iconName="pause"
                                enabled={false}
                                selected={false}
                                selectedCandidate={false}
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
    Fluxxor.StoreWatchMixin("PuzzleStore", "PlayControllerStore")
  ],

  getInitialState: function() {
    return {
    };
  },

  getStateFromFlux: function() {
    var flux = this.getFlux();
    return {
      playController: flux.store("PlayControllerStore").getState(),
      puzzle: flux.store("PuzzleStore").getState()
    };
  },

  render: function() {
    console.log("Rendering sudokuPlayController");

    return (
        <ControllerFrame
          digitSelected={this.state.playController.digitSelected}
          digitsEnabled={this.state.playController.digitsEnabled}
          entryMode={this.state.playController.entryMode}
          digitMode={this.state.playController.digitMode}
          clearMode={this.state.playController.clearMode}
          cellSelected={this.state.puzzle.cellSelected}
          onDigitClicked={this.onDigitClicked}
          onButtonClicked={this.onButtonClicked}
        />
    );
  },

  onDigitClicked: function(digit) {
    if (!this.state.playController.digitsEnabled[digit]) {
      console.log("Digit click disabled: " + digit);
    } else {
      console.log("Digit clicked: " + digit);

      if (this.state.playController.entryMode === EntryMode.NONE) {
        this.getFlux().actions.selectDigit(digit);
      }
      else if (this.state.playController.entryMode === EntryMode.DIGIT_SELECTED) {
        if (this.state.playController.digitSelected === digit) {
          this.getFlux().actions.unselectDigit();
        }
        else {
          this.getFlux().actions.selectDigit(digit);
        }
      }
      else if (this.state.playController.entryMode === EntryMode.CELL_SELECTED) {
        if (this.state.playController.digitMode === DigitMode.BIG_NUMBER) {
          this.getFlux().actions.addSolution(
            this.state.playController.cellRowSelected,
            this.state.playController.cellColSelected,
            digit
          );
        }
        else if (this.state.playController.digitMode === DigitMode.CANDIDATE) {
          this.getFlux().actions.toggleCandidate(
            this.state.playController.cellRowSelected,
            this.state.playController.cellColSelected,
            digit
          );
        }
        else {
          console.log("Invalid digit mode " + this.state.playController.digitMode);
        }
      }
      else {
        console.log("Invalid entry mode " + this.state.playController.entryMode);
      }
    }
  },

  onCellClicked: function(row, col) {
    if (this.state.playController.entryMode === EntryMode.CELL_SELECTED &&
        this.state.playController.cellRowSelected === row &&
        this.state.playController.cellColSelected === col) {
      this.getFlux().actions.unselectCell();
    }
    else if (this.state.playController.entryMode === EntryMode.CELL_SELECTED ||
             this.state.playController.entryMode === EntryMode.NONE) {
      this.getFlux().actions.selectCell(row, col);
    }
    else if (this.state.playController.entryMode === EntryMode.DIGIT_SELECTED) {
      if (this.state.playController.digitMode === DigitMode.BIG_NUMBER) {
        this.getFlux().actions
            .addSolution(row, col, this.state.playController.digitSelected);
      }
      else if (this.state.playController.digitMode === DigitMode.CANDIDATE) {
        this.getFlux().actions
            .toggleCandidate(row, col, this.state.playController.digitSelected);
      }
      else {
        console.log("Invalid digit mode " + this.state.playController.digitMode);
      }
    }
    else {
      console.log("Invalid entry mode " + this.state.playController.entryMode);
    }
  },

  onButtonClicked: function(iconName) {
    console.log("Button clicked: " + iconName);

    if (iconName === "create") {
      if (this.state.playController.digitMode === DigitMode.BIG_NUMBER ||
          this.state.playController.digitMode === DigitMode.CLEAR) {
        this.getFlux().actions.setDigitMode(DigitMode.CANDIDATE);
      }
      else {
        this.getFlux().actions.setDigitMode(DigitMode.BIG_NUMBER);
      }
    }
    else if (iconName === "clear") {
      if (this.state.playController.entryMode === EntryMode.CELL_SELECTED) {
        this.getFlux().actions.clearCell(this.state.playController.cellRowSelected,
                                        this.state.playController.cellColSelected);
      }
      else {
        if (this.state.playController.digitMode === DigitMode.CLEAR) {
          this.getFlux().actions.unselectDigit();
          this.getFlux().actions.setDigitMode(DigitMode.BIG_NUMBER);
        } else {
          this.getFlux().actions.setDigitMode(DigitMode.CLEAR);
        }
      }
    }
  }

});

module.exports = SudokuPlayController;