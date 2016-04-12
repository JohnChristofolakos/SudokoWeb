#SudokuWeb
This is a port of my SudokuSolver project from a JavaFX desktop application to a JavaScript web app.

Also a work in progress, currently this has:
* a model layer with comprehensive unit tests;
* an HTML rendering layer that is driven by flux;
* a puzzle initialisation routine that just sets up a hard-coded puzzle.

Major todos:
* add a controller to allow manual solving
* migrate the logical solver and its controller from the Java app
* implement REST/JSON to retrieve puzzle from the server

The project uses node, npm, React, babel with react and es2015 plugins, jest, CommonJS modularisation. My first significant JavaScript project so reviewers should please treat it kindly :)