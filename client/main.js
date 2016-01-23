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
    var mouseLeft = false;

    var selected_tool = "move";

    var canvas;
    var ctx;

    var picture_id;

    var image;

    var picture = [];

    var undo_states = [];

    var colors = [];
    var selectedColor = 1;

    //------------------------- LOGICZ ------------------------//
    
    function genEmptyPicture() {
        var picture = [];
        for (var r = 0; r < DIMS; ++r) {
            picture.push([]);
            for (var c = 0; c < DIMS; ++c) {
                random = false;

                if (random) picture[r].push( ((Math.random()<0.5)?0:((Math.random()<0.5)?1:((Math.random()<0.5)?2:((Math.random()<0.5)?3:4)))) );
                else picture[r].push(-1);
            }
        }
        return picture;
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

    function fill(data, x, y, newValue) {
        // get target value
        var target = data[x][y];

        function flow(x,y) {
            // bounds check what we were passed
            if (x >= 0 && x < data.length && y >= 0 && y < data[x].length) {
                if (data[x][y] === target) {
                    data[x][y] = newValue;
                    flow(x-1, y);    // check up
                    flow(x+1, y);    // check down
                    flow(x, y-1);    // check left
                    flow(x, y+1);    // check right
                }
            }
        }

        flow(x,y);
    }

    function savePicture () {
        var currentState = [];

        for (var r = 0; r < DIMS; ++r) {
            currentState.push([]);
            for (var c = 0; c < DIMS; ++c) {
                currentState[r][c] = picture[r][c];
            }
        }

        if (undo_states.length >= 25) {
            undo_states.shift();
        }

        undo_states.push(currentState);
    }

    function undo() {
        var oldstate = undo_states.pop();

        for (var r = 0; r < DIMS; ++r) {
            for (var c = 0; c < DIMS; ++c) {
                picture[r][c] = oldstate[r][c];
            }
        }

        renderPicture();
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

                if (picture[r][c] !== -1) {
                    ctx.fillStyle = colors[picture[r][c]];
                    ctx.fillRect(lOffset, tOffset, SIZE+1, SIZE+1); // +1 cuz zoom
                }
                

                if (grid_on) {
                    ctx.strokeStyle = "rgba(100,100,100,0.5)";
                    ctx.lineWidth=0.5;
                    ctx.strokeRect(lOffset, tOffset, SIZE, SIZE);
                }
            }
        }


        ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.globalAlpha = 0.5;
            ctx.drawImage(image, 0, 0, GW, GH);
        ctx.restore()

        ctx.restore();
    }

    function initColorButtons() {
        for (var i = 0; i < colors.length; i++) {
            var colorButton = $('<input type="button" value="' + colors[i] + '" id = "btn_' + i + '"/>');
            $("#colorContainer").append(colorButton);
            $("#btn_"+i).click(function() {
                selectedColor = parseInt(this.id.replace( /^\D+/g, ''));
                if (selected_tool == "move") selected_tool = "freehand";
                console.log("using color " + colors[selectedColor])
            })
        }
    }

    // -------------------- MUH WEBSOCKETS --------------------//


    //--------------------- EVENT HANDLERS --------------------//

    $('#drawingboard').mousedown(function (e) {
        isDown = true;
        
        // Move Mode
        if (selected_tool == "move") {
            pX = e.pageX;
            pY = e.pageY;
        }

        // Freehand Mode
        if (selected_tool == "freehand") {
            // save canvas state at start of fill
            savePicture();

            var tile = resolveClickedPictureElement(canvas.relMouseCoords(e));

            if (picture[tile.r][tile.c] != selectedColor) {
                picture[tile.r][tile.c] = selectedColor;
                renderPicture();
            }
        }

        // Fill Mode
        if (selected_tool == "fill") {
            // save canvas state at start of fill
            savePicture();

            var tile = resolveClickedPictureElement(canvas.relMouseCoords(e));

            if (picture[tile.r][tile.c] != selectedColor) {
                fill(picture, tile.r, tile.c, selectedColor);
                renderPicture();
            }
        }
    }).mouseup(function (e) {
        isDown = false;
    }).mouseleave(function (e) {
        
        if (isDown) mouseLeft = true;
        
        isDown = false;
    }).mouseenter(function (e) {

        if (mouseLeft) isDown = true;

        mouseLeft = false;

    }).mousemove(function (e) {
        // Move Mode
        if (selected_tool == "move") {
            if (isDown) panPicture(e);
        }

        // Draw Mode
        if (selected_tool == "freehand" && isDown) {
            var tile = resolveClickedPictureElement(canvas.relMouseCoords(e));

            if (picture[tile.r][tile.c] != selectedColor) {
                picture[tile.r][tile.c] = selectedColor;
                renderPicture();
            }
        }
    });

    $(document).mouseup(function (e) {
        mouseLeft = false;
    });

    // Mousewheel
    function wheel(event) {
        // Move Mode
        if (selected_tool == "move"){
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
        if (selected_tool == "freehand") {

        }
    }

    if (window.addEventListener) {
        window.addEventListener('DOMMouseScroll', wheel, false);
    }
    window.onmousewheel = document.onmousewheel = wheel;


    // Buttons
    $("#btn_draw").click(function(){
        selected_tool = "freehand";

        console.log("freehand");
    });
    $("#btn_fill").click(function(){
        selected_tool = "fill";

        console.log("fill");
    });
    $("#btn_move").click(function(){
        selected_tool = "move";

        console.log("move");
    });

    $("#btn_toggle_grid").click(function(){
        grid_on = !grid_on;
        console.log("grid toggled " + ((grid_on)?"on":"off"));
        renderPicture();
    });
    $("#btn_undo").click(function(){
        undo();

        console.log("undone");
    });


    //--------------- MUH WEBSAHKETS -------------------//

    var socket = io.connect('http://192.168.43.150:8080/');

    function getImage (url) {
        var image = new Image();
        image.src = url;
        image.onload = function () {
            renderPicture();
        }
        return image;
    }

    socket.on('error', function (picture_obj) {
        alert("THERE WAS A BACKEND SERVER ERROR BRUH");
    });

    socket.on('newPicture', function (picture_obj) {
        console.log('Picture: ', picture_obj);

        // Init canvas context
        canvas = document.getElementById('drawingboard');
        ctx = canvas.getContext("2d");

        // set correct dimensions
        canvas.width = DIMS*SIZE;
        canvas.height = DIMS*SIZE;

        // Init colors and color buttons
        colors = picture_obj.colors;
        initColorButtons();

        // load image
        image = getImage('http://192.168.43.150:8080' + picture_obj.imageURL);

        picture_id = picture_obj._id;

        // generate / load picture
        DIMS = picture_obj.size;
        picture = genEmptyPicture(DIMS);

        // Inital render
        renderPicture();

        // show the board
        $(".drawContainer").css({display:"block"});
    })

    $("#btn_start").click(function(){
        socket.emit('requestPicture');
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

    console.log("gethype");
// })();