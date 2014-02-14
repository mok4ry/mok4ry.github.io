define([
    'jquery',
    'conway'
], function ($, gameOfLife) {
    var HEADER_GOL_CELL_WIDTH = 15,
        HEADER_GOL_CELL_HEIGHT = 15;

    var canvas = document.getElementById('header-canvas');
    canvas.width = $(document).width();
    canvas.height = 100;

    var golWidth = Math.floor(canvas.width / HEADER_GOL_CELL_WIDTH),
        golHeight = Math.floor(canvas.height / HEADER_GOL_CELL_HEIGHT);

    var game = gameOfLife(canvas, {
        width : golWidth,
        height : golHeight,
        toroidal : true,
        showGrid : false
    });

    game.addCells([
        { x : 3, y : 3 },
        { x : 3, y : 4 },
        { x : 4, y : 3 },
        { x : 4, y : 4 },
        { x : 4, y : 5 },
        { x : 5, y : 2 },
        { x : 5, y : 4 },
        { x : 5, y : 5 },
        { x : 6, y : 2 },
        { x : 6, y : 3 },
        { x : 6, y : 4 },
        { x : 7, y : 3 }
    ]);
    game.start();

    window.game = game; // for debugging
});
