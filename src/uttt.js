/**
 * The MIT License (MIT)
 * Copyright © 2013
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the “Software”), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR
 * ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

var ut = {};


ut.constants = {
  BOARD_SIZE: 3
};


ut.events = {
  CELL_ACTIVATED: 'cellactivated',
  CELL_CLICKED: 'cellclicked',
  GRID_COMPLETE: 'gridcomplete'
};


/**
 * Winning states, in row, col order.
 */
ut.states = [
  [0, 0, 0, 1, 0, 2],  // Left to right.
  [1, 0, 1, 1, 1, 2],
  [2, 0, 2, 1, 2, 2],
  [0, 0, 1, 0, 2, 0],  // Top to bottom.
  [0, 1, 1, 1, 2, 1],
  [0, 2, 1, 2, 2, 2],
  [0, 0, 1, 1, 2, 2],  // Diagonal.
  [2, 0, 1, 1, 0, 2]
];



/**
 * Game controller.
 */
ut.Game = function() {
  this.env = new ut.Environment();

  // Bind the incepted grids with Cell constructors.
  var innerGrid = ut.Grid.bind(undefined, ut.Cell);
  this.grid = new ut.Grid(innerGrid);
  this.grid.addEventListener(ut.events.GRID_COMPLETE,
      this.onGameComplete, this);

  this.gridView = new ut.GridView(this.grid);
  // TODO: Different event?
  this.gridView.addEventListener(ut.events.CELL_ACTIVATED,
      this.onCellActivated, this);
};


ut.Game.prototype.onGameComplete = function(grid) {
  var winner = grid.getMarker();
  if (winner == ut.Marker.STALEMATE) {
    alert('Stalemate!');
  } else {
    alert(winner.value);
  }
};


ut.Game.prototype.onCellActivated = function(cell) {
  cell.setMarker(this.env.activeMarker);
};



ut.Environment = function() {
  this.stageWidth = 500;
  this.stageHeight = 500;
  this.activeMarker = new ut.Marker('player1');
};



ut.SelectableView = function(className) {
  EventDispatcher.call(this);

  this.element = document.createElement('div');
  this.element.className = className;
};
ut.SelectableView.prototype = new EventDispatcher();


ut.SelectableView.prototype.select = function() {
  this.element.className += ' selected';
  this.selected = true;
};


ut.CellView = function(cell) {
  ut.SelectableView.call(this, 'cell');

  this.cell = cell;
  this.element.addEventListener('click', this.onCellClicked.bind(this));
};
ut.CellView.prototype = new ut.SelectableView();


ut.CellView.prototype.onCellClicked = function(evt) {
  if (!this.selected) {
    this.triggerEvent(ut.events.CELL_CLICKED, this);
  }
};



ut.GridView = function(grid, opt_className) {
  ut.SelectableView.call(this, opt_className || 'grid');

  this.grid = grid;
  grid.forEachCell(grid.hasGridCells() ?
      this.createGridView.bind(this) :
      this.createCellView.bind(this));
};
ut.GridView.prototype = new ut.SelectableView();


ut.GridView.prototype.createGridView = function(grid) {
  var gridView = new ut.GridView(grid, 'grid cell');
  gridView.addEventListener(ut.events.CELL_CLICKED, this.reportCellSelected, this);
  this.element.appendChild(gridView.element);
};


ut.GridView.prototype.createCellView = function(cell) {
  var cellView = new ut.CellView(cell);
  cellView.addEventListener(ut.events.CELL_CLICKED, this.onCellSelected, this);
  this.element.appendChild(cellView.element);
};


ut.GridView.prototype.reportCellSelected = function(cellView) {
  var cell = cellView.cell;
  cellView.select();
  this.triggerEvent(ut.events.CELL_ACTIVATED, cell);
};


ut.GridView.prototype.onCellSelected = function(cellView) {
  // TODO: Only if the grid is active.
  this.triggerEvent(ut.events.CELL_CLICKED, cellView);
};



ut.Marker = function(value) {
  this.value = value;
};

ut.Marker.STALEMATE = new ut.Marker('__stalemate');



ut.Cell = function() {
  EventDispatcher.call(this);

  this.marker = null;
};
ut.Cell.prototype = new EventDispatcher();


/**
 * Activates the current cell with the given marker.
 * @param {ut.Marker]
 */
ut.Cell.prototype.setMarker = function(marker) {
  this.marker = marker;
  this.triggerEvent(ut.events.CELL_ACTIVATED, this);
};


ut.Cell.prototype.isEmpty = function() {
  return !this.marker;
};


ut.Cell.prototype.getMarker = function() {
  return this.marker;
};



/**
 * Creates a grid filled with cells of the given variety.
 * @constructor
 * @extends {ut.Cell}
 */
ut.Grid = function(cellCtor) {
  ut.Cell.call(this);

  /**
   * References to board cells.
   * @type {Array.<Array.<ut.Cell>>}
   */
  this.cells = null;

  /**
   * Cell constructor reference.
   * @type {Function}
   */
  this.cellCtor = cellCtor;

  this.initialize();
};
ut.Grid.prototype = new ut.Cell();


/**
 * Checks whether the cells of this grid are grids.
 */
ut.Grid.prototype.hasGridCells = function() {
  return this.cellCtor != ut.Cell;
};


/**
 * Resets the grid to a clean state.
 */
ut.Grid.prototype.initialize = function() {
  this.cells = [];
  for (var i = 0; i < ut.constants.BOARD_SIZE; i++) {
    this.cells[i] = [];
    for (var j = 0; j < ut.constants.BOARD_SIZE; j++) {
      var cell = new this.cellCtor();
      this.cells[i][j] = cell;
      cell.addEventListener(ut.events.CELL_ACTIVATED, this.checkStatus, this);
    }
  }
};


/**
 * Activates the grid in favor of a specific marker.
 * @override
 */
ut.Grid.prototype.setMarker = function(marker) {
  ut.Cell.prototype.setMarker.call(this, marker);
  this.triggerEvent(ut.events.GRID_COMPLETE, this);
};


/**
 * Checks if the grid is in an ended stated.
 */
ut.Grid.prototype.checkStatus = function(cell) {
  for (var i = 0; i < ut.states.length; i++) {
    var state = ut.states[i];
    var cell = this.cells[state[0]][state[1]];
    if (cell.isEmpty()) {
      continue;
    }

    var marker = cell.getMarker();
    if (marker == this.cells[state[2]][state[3]].getMarker() &&
        marker == this.cells[state[4]][state[5]].getMarker()) {
      // We have a winner.
      this.setMarker(marker);
      return;
    }
  }
  // Check for a stalemate.
  var hasMoves = false;
  this.forEachCell(function(cell) {
    if (cell.isEmpty()) {
      // Still moves to make.
      hasMoves = true;
      return false;
    }
  });
  if (!hasMoves) {
    this.setMarker(ut.Marker.STALEMATE);
  }
};


/**
 * Iterates over the grid cells. Breaks if the given handler
 * returns false.
 */
ut.Grid.prototype.forEachCell = function(handler) {
  for (var i = 0; i < this.cells.length; i++) {
    var row = this.cells[i];
    for (var j = 0; j < row.length; j++) {
      if (handler(row[j], i, j) == false) {
        return;
      }
    }
  }
};
