(function () {
    //------------------------- CONSTS ------------------------//
    var DIMS = 32;
    var SIZE = 24;

    var GW = DIMS*SIZE;
    var GH = DIMS*SIZE;

    //-------------------------- VARS -------------------------//

    var gX = 0,
        gY = 0,
        pX = 0,
        pY = 0,
        gScale = 1,
        speed = 1;

    var grid_on = true;

    var isDown = false;

    var drawMode = false;


    var picture = [];

    var colors = ["white","lightblue","pink","lightgreen","black"];

    //------------------------- LOGICZ ------------------------//
    
    function genEmptyPicture() {
        for (var r = 0; r < DIMS; ++r) {
            picture.push([]);
            for (var c = 0; c < DIMS; ++c) {
                picture[r].push( ((Math.random()<0.5)?0:((Math.random()<0.5)?1:((Math.random()<0.5)?2:((Math.random()<0.5)?3:4)))) );
            }
        }
    } 

    //------------------------- RENDER ------------------------//

    function zoomPicture(delta) {
        gScale += delta * 0.01;
        if (gScale < 1) gScale = 1;
        renderPicture();
    }

    function rescalePicture(e) {
        gX -= (pX - e.pageX) * speed;
        gY -= (pY - e.pageY) * speed;
        pX = e.pageX;
        pY = e.pageY;
        if (gX > 0) gX = 0;
        if (gX < canvas.width - GW * gScale) gX = canvas.width - GW * gScale;
        if (gY > 0) gY = 0;
        if (gY < canvas.height - GH * gScale) gY = canvas.height - GH * gScale;

        renderPicture();
    }

    function renderPicture() {
        // clear the old canvasaroo
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(gX, gY);
        ctx.scale(gScale, gScale);

        for (var r = 0; r < DIMS; ++r) {
            for (var c = 0; c < DIMS; ++c) {
                var lOffset = c * SIZE;
                var tOffset = r * SIZE;

                ctx.fillStyle = colors[picture[r][c]];
                ctx.fillRect(lOffset, tOffset, SIZE, SIZE);

                if (grid_on) {
                    ctx.strokeStyle = "rgba(100,100,100,0.5)";
                    ctx.lineWidth=0.5;
                    ctx.strokeRect(lOffset, tOffset, SIZE, SIZE);
                }
            }
        }
        ctx.restore();
    }

    //--------------------- EVENT HANDLERS --------------------//

    $('#drawingboard').mousedown(function (e) {
        isDown = true;
        
        // Move Mode
        if (!drawMode) {
            pX = e.pageX;
            pY = e.pageY;
        }

        // Draw Mode
        if (drawMode) {

        }

    }).mouseup(function (e) {
        isDown = false;
    }).mouseout(function (e) {
        isDown = false;
    }).mousemove(function (e) {
        // Move Mode
        if (!drawMode) {
            if (isDown) rescalePicture(e);
        }

        // Draw Mode
        if (drawMode) {

        }
    });

    // Mousewheel
    function wheel(event) {
        // Move Mode
        if (!drawMode){
            var delta = 0;
            if (!event) event = window.event;
            if (event.wheelDelta) {
                delta = event.wheelDelta / 120;
            } else if (event.detail) {
                delta = -event.detail / 3;
            }
            if (delta) {
                zoomPicture(delta);
            }
            if (event.preventDefault) {
                event.preventDefault();
            }
            event.returnValue = false;
        }

        // Draw Mode
        if (drawMode) {

        }
    }

    if (window.addEventListener) {
        window.addEventListener('DOMMouseScroll', wheel, false);
    }
    window.onmousewheel = document.onmousewheel = wheel;


    // Buttons
    $("#btn_draw").click(function(){
        drawMode = true;
        console.log("draw mode on");
    });
    $("#btn_move").click(function(){
        drawMode = false;
        console.log("draw mode off");
    });
    $("#btn_toggle_grid").click(function(){
        grid_on = !grid_on;
        console.log("grid toggled " + ((grid_on)?"on":"off"));
        renderPicture();
    });

    //-------------------------- MAIN -------------------------//

    // Init canvas context
    var canvas = document.getElementById('drawingboard');
    var ctx = canvas.getContext("2d");

    canvas.width = DIMS*SIZE;
    canvas.height = DIMS*SIZE;

    genEmptyPicture(DIMS);

    renderPicture();

    console.log("gethype");
})();