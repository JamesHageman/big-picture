// (function () {
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
    var selectedColor = 4;

    //------------------------- LOGICZ ------------------------//
    
    function genEmptyPicture() {
        for (var r = 0; r < DIMS; ++r) {
            picture.push([]);
            for (var c = 0; c < DIMS; ++c) {
                random = false;

                if (random) picture[r].push( ((Math.random()<0.5)?0:((Math.random()<0.5)?1:((Math.random()<0.5)?2:((Math.random()<0.5)?3:4)))) );
                else picture[r].push(0);
            }
        }
    } 
    
    /* returns {r:row, c:column} given mouse position of canvas */
    function resolveClickedPictureElement(cords) {
        eR = cords.y;
        eC = cords.x;

        // translate
        eR -= gY;
        eC -= gX;

        // scale
        eR /= gScale;
        eC /= gScale;

        // get cords
        eR = Math.floor(eR / SIZE);
        eC = Math.floor(eC / SIZE);

        return {
            r:eR,
            c:eC
        };
    }

    //------------------------- RENDER ------------------------//

    function zoomPicture(delta) {
        gScale += delta * 0.01;
        if (gScale < 1) gScale = 1;
        renderPicture();
    }

    function panPicture(e) {
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
                ctx.fillRect(lOffset, tOffset, SIZE+1, SIZE+1); // +1 cuz zoom

                if (grid_on) {
                    ctx.strokeStyle = "rgba(100,100,100,0.5)";
                    ctx.lineWidth=0.5;
                    ctx.strokeRect(lOffset, tOffset, SIZE, SIZE);
                }
            }
        }
        ctx.restore();
    }

    function initColorButtons() {
        for (var i = 0; i < colors.length; i++) {
            var colorButton = $('<input type="button" value="' + colors[i] + '" id = "btn_' + i + '"/>');
            $("#colorContainer").append(colorButton);
            $("#btn_"+i).click(function() {
                selectedColor = parseInt(this.id.replace( /^\D+/g, ''));
            })
        }
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
            var tile = resolveClickedPictureElement(canvas.relMouseCoords(e));

            if (picture[tile.r][tile.c] != selectedColor) {
                picture[tile.r][tile.c] = selectedColor;
                renderPicture();
            }
        }

    }).mouseup(function (e) {
        isDown = false;
    }).mouseout(function (e) {
        isDown = false;
    }).mousemove(function (e) {
        // Move Mode
        if (!drawMode) {
            if (isDown) panPicture(e);
        }

        // Draw Mode
        if (drawMode && isDown) {
            var tile = resolveClickedPictureElement(canvas.relMouseCoords(e));

            if (picture[tile.r][tile.c] != selectedColor) {
                picture[tile.r][tile.c] = selectedColor;
                renderPicture();
            }
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

    //------------------------- MAGIC -------------------------//

    function relMouseCoords(event){
        var totalOffsetX = 0;
        var totalOffsetY = 0;
        var canvasX = 0;
        var canvasY = 0;
        var currentElement = this;

        do{
            totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
            totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
        }
        while(currentElement = currentElement.offsetParent)

        canvasX = event.pageX - totalOffsetX;
        canvasY = event.pageY - totalOffsetY;

        return {x:canvasX, y:canvasY}
    }
    HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;

    //-------------------------- MAIN -------------------------//

    // Init canvas context
    var canvas = document.getElementById('drawingboard');
    var ctx = canvas.getContext("2d");

    canvas.width = DIMS*SIZE;
    canvas.height = DIMS*SIZE;

    // Init color buttons
    initColorButtons();

    // generate / load image
    genEmptyPicture(DIMS);

    // Inital render
    renderPicture();

    console.log("gethype");
// })();