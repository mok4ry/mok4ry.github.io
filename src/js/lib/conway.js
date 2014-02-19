window.requestAnimFrame = (function(callback) {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

define(function () {
    
    var LIGHT_GRAY = '#D3D3D3', BLACK = '#000000', WHITE = '#FFFFFF';

    var emptyCellBoard = function (width, height) {
        var cells = new Array(width * height);
        for (var i = 0; i < cells.length; i++) {
            cells[i] = false;
        }
        return cells;
    };
    
    var defaultOpts = {
        height : 100,
        width : 100,
        // toroidal array wraps around edge, like FF7 map
        toroidal : true,
        // more animation frames skipped means lower FPS, and vice versa
        animFramesToSkip : 12,
        showGrid : true
    };

    return function (canvas, opts) {
        var trueOpts = $.extend(defaultOpts, opts),
            width = trueOpts.width,
            height = trueOpts.height,
            toroidal = trueOpts.toroidal,
            animFramesToSkip = trueOpts.animFramesToSkip,
            showGrid = true; // hardcore for now until no grid looks pretty

        var cells = emptyCellBoard(width, height),
            prevGen = emptyCellBoard(width, height);
        var ctx = canvas.getContext('2d');
        
        var started = false,
            runAnimation = false;
       
        var currentAnimFrame = 0;

        var canvasHeight = canvas.height,
            canvasWidth = canvas.width;

        var cellWidth = canvas.width / width,
            cellHeight = canvas.height / height;

        var getIndexFromCoords = function (x, y) {
            return (x - 1) + ((y - 1) * width);
        };

        var nextStateOfCellAtIndex = function (index) {
            var liveNeighbors = getNumLiveNeighborsOfIndex(index);
            if (cells[index]) { // cell is live
                return liveNeighbors == 2 || liveNeighbors == 3;
            } else {  // cell is dead
                return liveNeighbors == 3;
            }
        };

        var getNumLiveNeighborsOfIndex = function (index) {
            var neighbors = getNeighborIndicesOfIndex(index),
                count = 0;
            for (var i = 0; i < neighbors.length; i++) {
                count += cells[neighbors[i]] ? 1 : 0;
            }
            return count;
        };

        var getNeighborIndicesOfIndex = function (index) {
            var indices = [], hw = height*width;
            
            var onLeftEdge = index % width == 0,
                onRightEdge = index % width == (width - 1),
                onTopEdge = index - width < 0,
                onBottomEdge = index + width >= cells.length;

            var N = index - width, NE = N + 1, NW = N - 1,
                E = index + 1, W = index - 1,
                S = index + width, SE = S + 1, SW = S - 1;
            
            if (onLeftEdge) {
                if (onTopEdge) {
                    arrayPushAll(indices, E, SE, S);
                    if (toroidal) arrayPushAll(indices,
                        SW + width,
                        W + width,
                        NW + hw + width,
                        N + hw,
                        NE + hw);
                } else if (onBottomEdge) {
                    arrayPushAll(indices, N, NE, E);
                    if (toroidal) arrayPushAll(indices,
                        NW + width,
                        W + width,
                        SW - hw + width,
                        S - hw,
                        SE - hw);
                } else {
                    arrayPushAll(indices, N, NE, E, SE, S);
                    if (toroidal) arrayPushAll(indices,
                        NW + width,
                        W + width,
                        SW + width);
                }
            } else if (onRightEdge) {
                if (onTopEdge) {
                    arrayPushAll(indices, W, SW, S);
                    if (toroidal) arrayPushAll(indices,
                        NW + hw,
                        N + hw,
                        NE + hw - width,
                        E - width,
                        SE - width);
                } else if (onBottomEdge) {
                    arrayPushAll(indices, W, NW, N);
                    if (toroidal) arrayPushAll(indices,
                        NE - width,
                        E - width,
                        SE - hw - width,
                        S - hw,
                        SW - hw);
                } else {
                    arrayPushAll(indices, N, NW, W, SW, S);
                    if (toroidal) arrayPushAll(indices,
                        NE - width,
                        E - width,
                        SE - width);
                }
            } else if (onTopEdge) {
                arrayPushAll(indices, W, SW, S, SE, E);
                if (toroidal) arrayPushAll(indices,
                    NW + hw,
                    N + hw,
                    NE + hw);
            } else if (onBottomEdge) {
                arrayPushAll(indices, W, NW, N, NE, E);
                if (toroidal) arrayPushAll(indices,
                    SW - hw,
                    S - hw,
                    SE - hw);
            } else {
                arrayPushAll(indices, W, NW, N, NE, E, SE, S, SW);
            }

            return indices;
        };

        var arrayPushAll = function (arr /* arg1, arg2, ... */) {
            var args = Array.prototype.slice.call(arguments, 0);
            for (var i = 1; i < args.length; i++) arr.push(args[i]);
        }

        var getCanvasCoordsFromIndex = function (index) {
            var gridCoords = getCoordsFromIndex(index), canvasCoords = {};
            canvasCoords.x = (gridCoords.x - 1) * cellWidth;
            canvasCoords.y = (gridCoords.y - 1) * cellHeight;
            return canvasCoords;
        };

        var getCoordsFromIndex = function (index) {
            var coords = {}
            coords.x = (index % width) + 1;
            coords.y = Math.floor(index/width) + 1;
            return coords;
        };

        var addCell = function (index) {
            cells[index] = true;
        };

        var drawCells = function (force) { 
            for (var i = 0; i < cells.length; i++)
                if (force || prevGen[i] != cells[i])
                    toggleCell(i, cells[i]);
        };

        var tick = function () {
            if (currentAnimFrame == 0) {
                var nextGen = emptyCellBoard(width, height);
                for (var i = 0; i < nextGen.length; i++)
                    nextGen[i] = nextStateOfCellAtIndex(i);
                prevGen = cells;
                cells = nextGen;
                drawCells();
            }

            if (runAnimation) {
                currentAnimFrame = (currentAnimFrame + 1) % animFramesToSkip;
                window.requestAnimFrame(tick);
            }
        };

        var toggleCell = function (index, show) {
            var coords = getCanvasCoordsFromIndex(index);

            drawCellAtCoords(coords, show ? BLACK : WHITE);
            showGrid && outlineCellAtCoords(coords);
        };

        var outlineCellAtCoords = function (coords) { 
            ctx.lineWidth = 0.5; ctx.strokeStyle = LIGHT_GRAY;
            ctx.strokeRect(coords.x, coords.y, cellWidth, cellHeight);
        };

        var drawCellAtCoords = function (coords, color) {
            ctx.fillStyle = color;
            ctx.fillRect(coords.x, coords.y, cellWidth, cellHeight);
        };

        var api = {
            addCell : function (x, y) {
                !started && addCell(getIndexFromCoords(x, y));
            },
            addCells : function (newCells) {
                var that = this, cell;
                if (!started) {
                    for (var i = 0; i < newCells.length; i++) {
                        cell = newCells[i];
                        addCell(getIndexFromCoords(cell.x, cell.y));
                    }
                }
                drawCells(true);
            },
            start : function () {
                started = true;
                runAnimation = true;
                window.requestAnimFrame(tick);
            }
        };

        drawCells(true);

        return api;
    };
});
