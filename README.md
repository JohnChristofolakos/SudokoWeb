#SudokuWeb
This is a port of my SudokuSolver project from a JavaFX desktop application to a JavaScript web app.

Also a work in progress, currently this has:
* a model layer with comprehensive unit tests;
* an HTML rendering layer that is driven by React/Flux;
* a puzzle initialisation routine that just sets up a hard-coded puzzle;
* a playable controller for manually solving the puzzle, also driven by React/Flux.

Major todos:
* finish the controller to allow manual solving - still needs undo/redo, check, and a play timer
* test suites for the flux stores
* kick up the UX a notch with some tactile effects, sounds, and a little splash when the puzzle is solved would be nice :)
* migrate the logical solver and its controller from the Java app
* implement a means to retrieve puzzles from the server

The project uses node, npm, React, JSX, Flux, browserify with babel plugins for react and es2015, jest/Jasmine, and CommonJS modularisation. My first significant JavaScript project so reviewers should please treat it kindly :)

It hasn't been deployed to a permanent home yet, but a reasonably stable version is usually available at [johnc.onl](http://johnc.onl)

Here is a screenshot of an in-progress puzzle.

![Solving a puzzle](screenshot.png?raw=true)