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
  CELL_SELECTED: 'cellclicked',
  GRID_COMPLETE: 'gridcomplete',
  GRID_LOCK_CHANGE: 'gridlockchange'
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
  this.grid.unlock();
  this.grid.addEventListener(ut.events.GRID_COMPLETE,
      this.onGameComplete, this);

  this.gridView = new ut.GridView(this.grid);
  // TODO: Different event?
  this.gridView.addEventListener(ut.events.CELL_SELECTED,
      this.onCellSelected, this);
};


ut.Game.prototype.onGameComplete = function(grid) {
  var winner = grid.getMarker();
  if (winner == ut.Marker.STALEMATE) {
    alert('Stalemate!');
  } else {
    alert(winner.value);
  }
};


ut.Game.prototype.onCellSelected = function(cell, parentGrid) {
  if (this.grid.isLocked() && parentGrid.isLocked()) {
    // The selected cell is not in a valid grid.
    return;
  }

  cell.setMarker(this.env.getActiveMarker());

  parentGrid.lock();
  // Unlock the grid corresponding to the last selected cell.
  var nextGrid = this.grid.cells[cell.row][cell.col];
  this.grid.setLock(!nextGrid.unlock());

  this.env.updateForNextTurn();
};



ut.Environment = function() {
  this.stageWidth = 500;
  this.stageHeight = 500;
  this.markers = [
    new ut.Marker('Ex'),
    new ut.Marker('Oh')
  ];
  this.activeMarker = 0;
};


ut.Environment.prototype.getActiveMarker = function() {
  return this.markers[this.activeMarker];
};


ut.Environment.prototype.updateForNextTurn = function() {
  this.activeMarker = (this.activeMarker + 1) % this.markers.length;
};



ut.SelectableView = function(className) {
  EventDispatcher.call(this);

  this.element = document.createElement('div');
  this.element.className = className;
};
ut.SelectableView.prototype = new EventDispatcher();


ut.SelectableView.prototype.select = function(cell) {
  var val = cell.getMarker().value.toLowerCase();
  this.element.className += ' selected ' + val;
  this.selected = true;
};


ut.CellView = function(cell, className) {
  ut.SelectableView.call(this, className);
  this.cell = cell;
  this.element.addEventListener('click', this.onCellClicked.bind(this));
  this.cell.addEventListener(ut.events.CELL_ACTIVATED, this.select, this);
};
ut.CellView.prototype = new ut.SelectableView();


ut.CellView.prototype.onCellClicked = function(evt) {
  if (!this.selected) {
    this.triggerEvent(ut.events.CELL_SELECTED, this.cell);
  }
};



ut.GridView = function(grid, className) {
  className = (className || '') + ' grid' + (grid.isLocked() ? '' : ' unlocked');
  ut.SelectableView.call(this, className);
  this.grid = grid;
  this.grid.addEventListener(ut.events.CELL_ACTIVATED, this.select, this);
  this.grid.addEventListener(ut.events.GRID_LOCK_CHANGE, this.setLock, this);
  var viewCtor = grid.hasGridCells() ? ut.GridView : ut.CellView;
  grid.forEachCell(this.createChildView.bind(this, viewCtor));
};
ut.GridView.prototype = new ut.SelectableView();


ut.GridView.prototype.setLock = function(locked) {
  if (locked) {
    this.element.classList.remove('unlocked');
  } else {
    this.element.classList.add('unlocked');
  }
};


ut.GridView.prototype.createChildView = function(viewCtor, cell) {
  // Both grid and cell views get the 'cell' CSS class since both
  // have parent views.
  var view = new viewCtor(cell, 'cell');
  view.addEventListener(ut.events.CELL_SELECTED, this.onCellSelected, this);
  this.element.appendChild(view.element);
};


/**
 * Bubbles up selected cell events.
 */
ut.GridView.prototype.onCellSelected = function(cell, opt_parent) {
  // Only non-filled grids should respond to events.
  if (this.grid.isEmpty()) {
    // Pass the grid that originated the selected cell.
    opt_parent = opt_parent || this.grid;
    this.triggerEvent(ut.events.CELL_SELECTED, cell, opt_parent);
  }
};



ut.Marker = function(value) {
  this.value = value;
};

ut.Marker.STALEMATE = new ut.Marker('__stalemate');



ut.Cell = function() {
  EventDispatcher.call(this);

  this.marker = null;
  this.row = 0;
  this.col = 0;
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


ut.Cell.prototype.setPosition = function(row, col) {
  this.row = row;
  this.col = col;
};


ut.Cell.prototype.getPosition = function() {
  return this.row + '_' + this.col;
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

  /**
   * Whether manipulation of the grid is allowed.
   * @type {Boolean}
   */
  this.locked = true;

  this.initialize();
};
ut.Grid.prototype = new ut.Cell();


/**
 * Checks whether the cells of this grid are grids.
 */
ut.Grid.prototype.hasGridCells = function() {
  return this.cellCtor != ut.Cell;
};


ut.Grid.prototype.isLocked = function() {
  return this.locked;
};


ut.Grid.prototype.lock = function() {
  return this.setLock(true);
};


ut.Grid.prototype.unlock = function() {
  return this.setLock(false);
};


ut.Grid.prototype.setLock = function(lock) {
  // Only unlock a grid if moves exist.
  if (this.locked != lock && (lock || this.isEmpty()) ) {
    this.locked = lock;
    this.triggerEvent(ut.events.GRID_LOCK_CHANGE, lock);
  }
  return this.isLocked();
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
      cell.setPosition(i, j);
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
