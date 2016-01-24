// (function () {
    //------------------------- CONSTS ------------------------//
    var DIMS = 32;
    var SIZE = 24;

    var GW;
    var GH;

    var socket = io.connect(
      window.location.host.startsWith('localhost') ?
        'http://192.168.43.150:8080/' : '/'
    );

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
    var stroke_size = 1;

    var canvas;
    var ctx;

    var picture_id;

    var image;

    var picture = [];

    var undo_states = [];

    var colors = [];
    var selectedColor = 1;

    var updateTimeoutHandle;

    var firstrun = true;

    var inDrawingMode = false;

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
        if (undo_states.length == 0) return;
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
        if ($("#colorContainer").is(":empty") == false) {
            $("#colorContainer").empty();
        }

        for (var i = 0; i < colors.length; i++) {
            var colorButton = $('<input type="button" \
                                        class="btn btn-default colorbtn" \
                                        style="background-color:'+ colors[i] +' !important" \
                                        id = "btn_' + i + '"/>'
                                );
            $("#colorContainer").append(colorButton);
            $("#btn_"+i).click(function() {
                selectedColor = parseInt(this.id.replace( /^\D+/g, ''));
                if (selected_tool == "move") {
                    selected_tool = "freehand";

                    $('.strokeContainer').css({display:"block"});
                }
                console.log("using color " + colors[selectedColor])
            })
        }
    }

    function enterMainView() {
        $(".mainContainer").css({display:"block"});
        $(".drawContainer").css({display:"none"});

        socket.emit("requestImages");

        inDrawingMode = false;
    }

    socket.on("getImages", function (image_object) {
        console.log(image_object);
        renderMainScreen(image_object);
    })

    function renderMainScreen(image_object) {
        if ($(".wips").is(":empty") == false) {
            $(".wips").empty();
        }

        $(".wips").append("<tr>\
            <th>Name</th>\
            <th>Colors</th>\
            <th>View</th>\
            <th>Draw</th>\
        </tr>");

        for (var i = image_object.inProgress.length - 1; i >= 0; i--) {
            console.log(image_object.inProgress[i]);

            var row = $("<tr></tr>");

            var name = $("<td>"+image_object.inProgress[i].friendlyName+"</td>");
            row.append(name);





            var coloredDotsRow = $("<td></td>");
            var coloredDots = $("<div style='height: 42px; overflow-y: scroll;'></div>")
            for (var j = 0; j < image_object.inProgress[i].colors.length; j++) {
                var color = image_object.inProgress[i].colors[j];
                var colordot = $('<div class="color-dot" \
                                    style="\
                                        background-color:' + color + ';\
                                "></div>');
                coloredDots.append(colordot);
            };
            coloredDotsRow.append(coloredDots);
            row.append(coloredDotsRow);






            var view = $('<td>&nbsp;&nbsp;&nbsp;</td>');
            view.data("_id", image_object.inProgress[i]._id);

            view.css({"background-color":"lightgrey"});
            view.css({cursor:"pointer"});

            view.hover(
                function() {
                    $( this ).css({"background-color":"lightblue"});
                }, function() {
                    $( this ).css({"background-color":"lightgrey"});
                }
            );

            view.click(function () {
                window.location.href = "/image.html?id=" + $(this).data("_id");
            });
            row.append(view);






            var contribute = $('<td>&nbsp;&nbsp;&nbsp;</td>');

            contribute.css({"background-color":"lightgrey"});
            contribute.css({cursor:"pointer"});

            contribute.hover(
                function() {
                    $( this ).css({"background-color":"lightblue"});
                }, function() {
                    $( this ).css({"background-color":"lightgrey"});
                }
            );

            contribute.data("_id", image_object.inProgress[i]._id);
            contribute.click(function() {
                socket.emit("requestPicture", $(this).data("_id"));
            });
            row.append(contribute);

            $(".wips").append(row);
        };
    }

    //--------------------- EVENT HANDLERS --------------------//
    function splotchCircle(tile, r) {
        for (var i = -(r-1); i <= (r-1); i++) {
            for (var j = -(r-1); j <= (r-1); j++) {
                a = tile.r + i;
                b = tile.c + j;

                if (Math.sqrt(i*i + j*j) <= (r-1)) {

                    try {
                        picture[a][b] = selectedColor;
                    } catch (e) {}
                }
            }
        }
        renderPicture();
    }

    function onDown(e) {
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

            if (stroke_size == 1) {
                if (picture[tile.r][tile.c] != selectedColor) {
                    picture[tile.r][tile.c] = selectedColor;
                    renderPicture();
                }
            } else splotchCircle(tile, stroke_size)
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
    }
    function onMove(e) {
        // Move Mode
        if (selected_tool == "move") {
            if (isDown) panPicture(e);
        }

        // Draw Mode
        if (selected_tool == "freehand" && isDown) {
            var tile = resolveClickedPictureElement(canvas.relMouseCoords(e));

            if (stroke_size == 1) {
                if (picture[tile.r][tile.c] != selectedColor) {
                    picture[tile.r][tile.c] = selectedColor;
                    renderPicture();
                }
            } else splotchCircle(tile, stroke_size)
        }
    }

    function addDrawEventHandlers () {
        $('#drawingboard').mousedown(function (e) {
            onDown(e);
        }).on("touchstart",function (e) {
            e.preventDefault();
            e = e.originalEvent.touches[0];
            onDown(e);
        }).mouseup(function (e) {
            isDown = false;
            updatePicture();
        }).on("touchend",function (e) {
            isDown = false;
            updatePicture();
        }).mouseleave(function (e) {
            if (isDown) mouseLeft = true;
            isDown = false;
        }).mouseenter(function (e) {
            if (mouseLeft) isDown = true;
            mouseLeft = false;
        }).mousemove(function (e) {
            onMove(e);
        }).on("touchmove", function (e) {
            e.preventDefault();
            e = e.originalEvent.touches[0];
            onMove(e);
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
        canvas.onmousewheel = wheel;


        // Buttons
        $("#btn_draw").click(function(){
            selected_tool = "freehand";

            $('.strokeContainer').css({display:"block"});

            console.log("freehand");
        });
        $("#btn_fill").click(function(){
            selected_tool = "fill";

            $('.strokeContainer').css({display:"none"});

            console.log("fill");
        });
        $("#btn_move").click(function(){
            selected_tool = "move";

            $('.strokeContainer').css({display:"none"});

            console.log("move");
        });

        $("#btn_stroke_sm").click(function(){
            stroke_size = 1;
        });
        $("#btn_stroke_md").click(function(){
            stroke_size = 2;
        });
        $("#btn_stroke_lg").click(function(){
            stroke_size = 3;
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
        $("#btn_clear").click(function(){
            savePicture();
            picture = genEmptyPicture();
            renderPicture();

            console.log("cleared");
        });

        $("#btn_done").click(sendFinishedPicture);
    }

    function resize () {
        if (inDrawingMode) {
            SIZE = $(".drawContainer").width() / DIMS;

            GW = DIMS*SIZE;
            GH = DIMS*SIZE;

            // set correct dimensions
            canvas.width = DIMS*SIZE;
            canvas.height = DIMS*SIZE;

            renderPicture();
        }
    }
    $( window ).resize(resize);

    //--------------- MUH WEBSAHKETS -------------------//

    function updatePicture() {
        // 10/10 error handling, would be trash programmer again
        for (var i = 0; i < picture.length; i++) {
            picture[i] = picture[i].slice(0, DIMS);
        }
        picture = picture.slice(0,DIMS);

        // in your click function, call clearTimeout
        window.clearTimeout(updateTimeoutHandle);
        updateTimeoutHandle = window.setTimeout(function(){
            // send this bed boi
            socket.emit("updatePicture", {
                _id:picture_id,
                pixels:picture
            });
            console.log("updated");
        }, 500);
    }

    function sendFinishedPicture() {
        // 10/10 error handling, would be trash programmer again
        for (var i = 0; i < picture.length; i++) {
            for (var j = 0; j < picture[i].length; j++) {
                if (picture[i][j] == -1) {
                    alert("Please fill in all blank spaces");
                    return;
                }
            }
            picture[i] = picture[i].slice(0, DIMS);
        }
        picture = picture.slice(0,DIMS);

        socket.emit("savePicture", {
            _id:picture_id,
            pixels:picture
        });
        console.log("sent");

        undo_states = [];

        enterMainView()
    }

    function getImage (url) {
        var image = new Image();
        image.src = url;
        image.onload = function () {
            renderPicture();
        }
        return image;
    }

    socket.on('serverError', function (picture_obj) {
        alert("THERE WAS A BACKEND SERVER ERROR BRUH");
    });

    socket.on('newPicture', function (picture_obj) {
        console.log('Picture: ', picture_obj);

        if (picture_obj == null) {
            alert("oops, looks like the picture has been finished!");
            return;
        }

        // Init canvas context
        canvas = document.getElementById('drawingboard');
        ctx = canvas.getContext("2d");

        // Find a nice size for the boxes
        SIZE = $(".drawContainer").width() / DIMS;

        GW = DIMS*SIZE;
        GH = DIMS*SIZE;

        // set correct dimensions
        canvas.width = DIMS*SIZE;
        canvas.height = DIMS*SIZE;

        // Init colors and color buttons
        colors = picture_obj.colors;
        initColorButtons();

        // load image
        image = getImage((window.location.host.startsWith('localhost') ? 'http://192.168.43.150:8080' : '') + picture_obj.imageURL);

        picture_id = picture_obj._id;

        // generate / load picture
        DIMS = picture_obj.size;
        if (picture_obj.pixels == null) picture = genEmptyPicture(DIMS);
        else picture = picture_obj.pixels;

        // Inital render
        renderPicture();

        // Add event handlers
        if (firstrun) addDrawEventHandlers();

        // show the board
        $(".not-drawing").css({display:"none"});
        $(".drawContainer").css({display:"block"});
        inDrawingMode= true;

        firstrun = false;

        resize();
    })

    $(".btn_start").click(function(){
        socket.emit('requestPicture');
    });

    //-------------------------- MAIN -------------------------//

    console.log("gethype");

    if (!localStorage.returning) {
        localStorage.returning = true;
        $(".startContainer").css({display:"block"});
    } else {
        enterMainView();
    }













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
        canvasY = event.pageY - totalOffsetY - $(window).scrollTop();

        return {x:canvasX, y:canvasY}
    }
    HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;
// })();
