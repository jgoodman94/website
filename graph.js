
// moves line line to (x1,y1), (x2,y2)
function moveLine(line, x1,y1, x2,y2) {
    var length = Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
    var angle = Math.atan2(y2-y1, x2-x1)*180/Math.PI;
    var transform = 'rotate('+angle+'deg)';
    var offsetLeft = x1 < x2 ? x1 : x2;
    var offsetTop = y1 < y2 ? y1 : y2;
    line.css({
        'transform':transform
    })
    .width(length)
    .offset({left:offsetLeft, top:offsetTop});
}

// create line from (x1,y1) to (x2,y2)
function createLine(x1,y1, x2,y2) {
    var line =  $('<div>')
                .appendTo(document.body)
                .addClass('line')
                .css({
                    'position':'absolute',
                });
    moveLine(line,x1,y1,x2,y2);
    moveLine(line,x1,y1,x2,y2); // safari hack
    return line;
}

// get adjacency matrix from adjacency lists representation
function getAdjMatrix(adjLists) {
    var numNodes = adjLists.length;
    var adjMatrix = [];
    for (var i = 0; i < numNodes; i++) {
        var currRow = new Array(numNodes).fill(0);
        for (var j = 0; j < adjLists[i].length; j++) {
            currRow[adjLists[i][j]] = 1;
        }
        adjMatrix.push(currRow);
    }
    return adjMatrix;
}

function updateAdjMatrixHTML(adjLists) {
    var adjMatrix = getAdjMatrix(adjLists);
    var adjMatrixString = "";
    for (var i = 0; i < adjMatrix.length; i++) {
        adjMatrixString += adjMatrix[i].toString() + "<br>";
    }
    $('.adj-matrix.results').html(adjMatrixString);
}

function makeElDraggable($el, zoom) {
    var canvasWidth = $(document.body).width();
    var canvasHeight = $(document.body).height();

    $el.draggable({
        drag: function(evt,ui) {
            // zoom fix
            ui.position.top = Math.round(ui.position.top / zoom);
            ui.position.left = Math.round(ui.position.left / zoom);

            // don't let draggable go outside canvas
            if (ui.position.left < 0) {
                ui.position.left = 0;
            }
            if (ui.position.left + $(this).width()*2 > canvasWidth) {
                ui.position.left = canvasWidth - $(this).width()*2;
            }
            if (ui.position.top < 0) {
                ui.position.top = 0;
            }
            if (ui.position.top + $(this).height()*2 > canvasHeight) {
                ui.position.top = canvasHeight - $(this).height()*2;
            }
        }
    });
}

$(function() {
    var destroyerOn = false;
    var nodeNbrs = [];
    var cursorX = 500;
    var cursorY = 300;
    var mousedown = false;
    var movingNodeID = -1;
    var numZooms = 0;
    var zoomVal = 1;

    var usingColor = false;
    var selectedColor = "";
    var adjMatrixPressed = false;

    var cmdDown = false;
    var existsSelectedNode = false;
    var selectedNodeID = -1;
    var selectedNodeX = 0;
    var selectedNodeY = 0;

    var ghostNode = $('<div class="node-ghost" id="node-ghost">');

    var nodeCounter = 0;
    makeElDraggable($('.node'), zoomVal);
    $(window).click(function(e) {
        cursorX = e.pageX;
        cursorY = e.pageY;

        // one of the below should be defined
        var evt = e || window.event;
        var shiftKeyPressed = evt.shiftKey;
        var x = (cursorX-20) + 'px';
        var y = (cursorY-20) + 'px';

        // create node!
        var nodeID = "node:" + nodeCounter;
        var node = $('<div class="node" id=' + nodeID + '>').css({
            position:'absolute',
            left:x,
            top:y
        });
        node.text(nodeCounter);

        if (shiftKeyPressed) {
            $(document.body).append(node);
            makeElDraggable(node, zoomVal);
            nodeCounter++;
            nodeNbrs.push([]);
            updateAdjMatrixHTML(nodeNbrs);
        }
    });

    $(document).on('keydown', function(e) {
        console.log('key code is : ' + e.keyCode);
        if (e.keyCode == 16) {
            console.log('shift down');

            var x = (cursorX-20) + 'px';
            var y = (cursorY-20) + 'px';
            ghostNode.css({
                position:'absolute',
                left:x,
                top:y
            });

            $(document.body).append(ghostNode);
        }
        else if (e.keyCode == 91 || e.keyCode == 93 || e.keyCode == 224 || e.keyCode == 17) {
            cmdDown = true;
        }
    });
    $(document).on('keyup', function(e) {
        if (e.keyCode == 16) {
            console.log('shift up');
            ghostNode.remove();
        } else if (e.keyCode == 91 || e.keyCode == 93 || e.keyCode == 224 || e.keyCode == 17) {
            cmdDown = false;
        }
    });
    $(document).on('mousemove', function(e) {
        var evt = e || window.event;
        cursorX = e.pageX;
        cursorY = e.pageY;
        if (mousedown) {
            // if in here, moving around node
            //
            // move each incident edge
            // works perfectly!!
            nodeNbrs[movingNodeID].forEach(function(nbrID) {
                var lineID = "edge:";
                if (movingNodeID < nbrID) {
                    lineID += movingNodeID + "." + nbrID;
                } else {
                    lineID += nbrID + "." + movingNodeID;
                }
                var line = document.getElementById(lineID);
                var jline = $(line);
                var movingNode = document.getElementById('node:' + movingNodeID);
                var jmovingNode = $(movingNode);
                var nbrNode = document.getElementById('node:' + nbrID);
                var jnbrNode = $(nbrNode);

                var x1 = jmovingNode.offset().left+20;
                var y1 = jmovingNode.offset().top+20;
                var x2 = jnbrNode.offset().left+20;
                var y2 = jnbrNode.offset().top+20;

                moveLine(jline, x1,y1, x2, y2);
            });
        } else if (evt.shiftKey) {
            // if in here, prepping to place new node

            var x = (cursorX-20) + 'px';
            var y = (cursorY-20) + 'px';
            ghostNode.css({
                position:'absolute',
                left:x,
                top:y
            });
        }
    });

    $(document).on('mousedown', '.node', function() {
        mousedown = true;
        movingNodeID = $(this).attr('id').split(':')[1];
        console.log('moving node: ' + movingNodeID);
    });
    $(document).on('mouseup', function() {
        mousedown = false;
        movingNodeID = -1;
        console.log('mouse up!');
    });

    $(document).on('click', '.destroyer', function() {
        if ($(this).hasClass('active')) {
            $(this).removeClass('active');
            $('body').css('cursor', 'default')
            destroyerOn = false;
        } else {
            $(this).addClass('active')
            $('body').css('cursor', 'crosshair')
            destroyerOn = true;
        }
    })

    $(document).on('click', '.line', function() {
        if (usingColor) {
            $(this).css('border-color', selectedColor);
            $(this).css('background', selectedColor);
        }
        if (destroyerOn) {
            console.log($(this).attr('id'))
            console.log("before: ");
            console.log(nodeNbrs)
            nodes = $(this).attr('id').split(':')[1].split('.');
            n1 = nodes[0]
            n2 = nodes[1]
            var i1 = nodeNbrs[n1].indexOf(n2)
            var i2 = nodeNbrs[n2].indexOf(n1)
            if (i1 > -1) {
                nodeNbrs[n1].splice(i1, 1)
            }
            if (i2 > -1) {
                nodeNbrs[n2].splice(i2, 1)
            }
            console.log("after: ");
            console.log(nodeNbrs)
            $(this).remove()
            updateAdjMatrixHTML(nodeNbrs);
        }
    });

    $(document).on('click', '.node', function() {
        if (usingColor) {
            $(this).css('background', selectedColor);
            $(this).css('color', "black");
            $(this).css('font-weight', 'bold');
        }
        if (cmdDown) {
            if (!existsSelectedNode) {
                $(this).addClass('selected');
                existsSelectedNode = true;
                selectedNodeID = $(this).attr('id').split(':')[1];
                selectedNodeX = $(this).offset().left+20;
                selectedNodeY = $(this).offset().top+20;
            } else {
                // return if we selected same node
                if ($(this).hasClass('selected')) {
                    $(this).removeClass('selected');
                    existsSelectedNode = false;
                    selectedNodeID = -1;
                    selectedNodeX = 0;
                    selectedNodeY = 0;
                } else {
                    // add edge!
                    var currNodeX = $(this).offset().left+20;
                    var currNodeY = $(this).offset().top+20;
                    var currNodeID = $(this).attr('id').split(':')[1];
                    var line;

                    // always name edge so smaller id comes before '.'
                    var lineID;
                    if (selectedNodeID < currNodeID) {
                        lineID = "edge:" + selectedNodeID + "." + currNodeID;
                    } else {
                        lineID = "edge:" + currNodeID + "." + selectedNodeID;
                    }
                    // only add line if it doesn't already exist
                    if (!document.getElementById(lineID)) {
                        line = createLine(selectedNodeX, selectedNodeY, currNodeX, currNodeY);
                        line.attr('id', lineID);

                        // update data structure
                        nodeNbrs[currNodeID].push(selectedNodeID);
                        nodeNbrs[selectedNodeID].push(currNodeID);
                        updateAdjMatrixHTML(nodeNbrs);
                    }

                    $('.node').removeClass('selected');
                    existsSelectedNode = false;
                    selectedNodeID = -1;
                    selectedNodeX = 0;
                    selectedNodeY = 0;
                }
            }
        } else if (destroyerOn) { // still some glitch here ...
            nodeID = $(this).attr('id').split(':')[1];
            // remove edges
            for (count = 0; count < nodeNbrs[nodeID].length; count++) {
                var nbrID = nodeNbrs[nodeID][count]
                var lineID = "edge:";
                if (nodeID < nbrID) {
                    lineID += nodeID + "." + nbrID;
                } else {
                    lineID += nbrID + "." + nodeID;
                }
                var line = document.getElementById(lineID);
                line.remove()
            }
            // remove node
            $(this).remove()
            // relabel nodes
            nodeCounter--
            $('.node').each(function() {
                nID = parseInt($(this).attr('id').split(":")[1])
                if (nID > nodeID) {
                    nID--
                }
                $(this).attr('id', 'node:' + nID)
                $(this).text(nID)
            })
            // relabel edges
            $('.line').each(function() {
                v1 = parseInt($(this).attr('id').split(":")[1].split(".")[0])
                v2 = parseInt($(this).attr('id').split(":")[1].split(".")[1])
                if (v1 > nodeID) {
                    v1--
                }
                if (v2 > nodeID) {
                    v2--
                }
                $(this).attr('id', 'edge:' + v1 + '.' + v2)
            })
            // adjust nodeNbrs
            for (ct=0; ct<nodeNbrs.length; ct++) {
                nodeNbrs[ct].splice(nodeNbrs[ct].indexOf(nodeID), 1)
            }
            nodeNbrs.splice(nodeID, 1)
            updateAdjMatrixHTML(nodeNbrs)
        }
    });
    $(document).on('mouseover', '.node', function() {
        if (destroyerOn) {
            $(this).css('cursor', 'crosshair');
        } else {
            $(this).css('cursor', 'move')
        }
    })

    $(document).on('click', '.color', function() {
        if ($('.colors').hasClass('color-select')) {
            if ($(this).hasClass('color-select')) {
                // de-select color
                $(this).removeClass('color-select');
                $('.colors').removeClass('color-select');
                usingColor = false;
            } else {
                // select new color
                $('.color').removeClass('color-select');
                $(this).addClass('color-select');
                selectedColor = $(this).css('background-color');
                console.log('selected color: ' + selectedColor);
                usingColor = true; // redundant
            }
        } else {
            // select first color
            $('.colors').addClass('color-select');
            $(this).addClass('color-select');
            selectedColor = $(this).css('background-color');
            console.log('selected color: ' + selectedColor);
            usingColor = true;
        }
    });

    $(document).on('click', '.adj-matrix.footer', function() {
        if ($(this).hasClass('pressed')) {
            $('.adj-matrix.results').hide();
            $(this).removeClass('pressed');
        } else {
            $(this).addClass('pressed');
            $('.adj-matrix.results').show();
        }
    });

    $(document).on('click', '.zoom', function() {
        console.log($('.node').offset().top);
        zoomIn = $(this).hasClass('inwards');
        numZooms = zoomIn ? numZooms + 1 : numZooms - 1;
        zoomVal = zoomIn ? zoomVal*(8.0/7) : zoomVal*(7.0/8);
        console.log('zoomVal: ' + zoomVal);
        $('.node').css({'zoom': zoomVal});
        makeElDraggable($('.node'), zoomVal);
        $('.line').css({'zoom':zoomVal});
        console.log(numZooms);
        if (numZooms < -3) {
            // no text in nodes anymore
            $('.node').html('');
        }
        if (numZooms == -3 && zoomIn) {
            $('.node').html(function() {
                return $(this).attr("id").split(":")[1];
            });
        }
    });





});
