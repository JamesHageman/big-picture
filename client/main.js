(function () {
    //------------------------- CONSTS ------------------------//
    var DIMS = 64;
    var SIZE = 16;

    var GW = DIMS*SIZE;
    var GH = DIMS*SIZE;

    //-------------------------- VARS -------------------------//

    var gX = 0,
        gY = 0,
        pX = 0,
        pY = 0,
        gScale = 1,
        speed = 2;

    var isDown = false;

    //------------------------- LOGICZ ------------------------//
    
    function genGrid() {
        
    } 

    //-------------------------- MAIN -------------------------//

    // Init canvas context
    var canvas = document.getElementById('drawingboard');
    var ctx = canvas.getContext("2d");

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.font = "14px sans-serif";

    var grid = [];
    for (var i = 0; i < cells; ++i) {
        if (Math.random() < 0.5) {
            grid.push("#FF8ED6");
        } else {
            grid.push("#8ED6FF");
        }
    }

    drawGrid(0, 0);

    $('#canvas').mousedown(function (e) {
        isDown = true;
        pX = e.pageX;
        pY = e.pageY;
    }).mouseup(function (e) {
        isDown = false;
    }).mouseout(function (e) {
        isDown = false;
    }).mousemove(function (e) {
        if (isDown) {
            gX += (pX - e.pageX) * speed;
            gY += (pY - e.pageY) * speed;
            pX = e.pageX;
            pY = e.pageY;
            if (gX > 0) gX = 0;
            if (gX < canvas.width - gW * gScale) gX = canvas.width - gW * gScale;
            if (gY > 0) gY = 0;
            if (gY < canvas.height - gH * gScale) gY = canvas.height - gH * gScale;

            drawGrid();
        }
    });

    function drawGrid() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(gX, gY);
        ctx.scale(gScale, gScale);
        for (var i = 0; i < cols; ++i) {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(i * size, 0, size, headerSize);
            ctx.strokeRect(i * size, 0, size, headerSize);

            ctx.fillStyle = "#000000";
            ctx.save();
            ctx.translate(i * size + 16, headerSize - 8);
            ctx.rotate(Math.PI * 1.5);
            ctx.fillText("Column " + i, 0, 0);
            ctx.restore();

            for (var j = 0; j < rows; ++j) {
                ctx.fillStyle = grid[i * rows + j];
                ctx.fillRect(i * size, j * size + headerSize, size, size);
                ctx.strokeRect(i * size, j * size + headerSize, size, size);
            }
        }
        ctx.restore();
    }

    /*
     * Mousewheel
     */
    function handle(delta) {
        gScale += delta * 0.01;
        if (gScale < 1) gScale = 1;
        drawGrid();
    }

    function wheel(event) {
        var delta = 0;
        if (!event) event = window.event;
        if (event.wheelDelta) {
            delta = event.wheelDelta / 120;
        } else if (event.detail) {
            delta = -event.detail / 3;
        }
        if (delta) {
            handle(delta);
        }
        if (event.preventDefault) {
            event.preventDefault();
        }
        event.returnValue = false;
    }

    if (window.addEventListener) {
        window.addEventListener('DOMMouseScroll', wheel, false);
    }
    window.onmousewheel = document.onmousewheel = wheel;

    console.log("gethype");
})();