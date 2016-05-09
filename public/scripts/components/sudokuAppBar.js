var React = require("react");
var Fluxxor = require("fluxxor");

import AppBar from "material-ui/AppBar";
import IconMenu from "material-ui/IconMenu";
import IconButton from "material-ui/IconButton";
import MenuItem from "material-ui/MenuItem";

import NavigationMoreVert from "material-ui/svg-icons/navigation/more-vert";
import NavigationClose from "material-ui/svg-icons/navigation/close";

var SudokuAppBar = React.createClass({
  propTypes: {
    onLoadPuzzle: React.PropTypes.func.isRequired
  },

  mixins: [
    Fluxxor.FluxMixin(React)
  ],


  render: function() {
    console.log("Rendering SudokuAppBar");
    
    return (
      <div className="sudokuAppBar">
        <AppBar
          title="Sudoku"
          showMenuItemButton={false}
          /* iconElementLeft={<IconButton><NavigationClose /></IconButton>} */
          iconElementRight={
            <IconMenu
              iconButtonElement={<IconButton><NavigationMoreVert /></IconButton>}
              anchorOrigin={{horizontal: "right", vertical: "top"}}
              targetOrigin={{horizontal: "right", vertical: "top"}}
            >
              <MenuItem
                primaryText="Load puzzle"
                onTouchTap={this.props.onLoadPuzzle}
              />
            </IconMenu>
          }
        />
      </div>
    );
  }

});

module.exports = SudokuAppBar;