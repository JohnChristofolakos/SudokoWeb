var React = require("react");
var ReactDOM = require("react-dom");
var SudokuApp = require("./components/sudokuApp");

console.log("Rendering app");
ReactDOM.render(
  <SudokuApp />,
  document.getElementById("sudokuApp")
);