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
    var length = Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
    var angle = Math.atan2(y2-y1, x2-x1)*180/Math.PI;
    var transform = 'rotate('+angle+'deg)';
    var offsetLeft = x1 < x2 ? x1 : x2;
    var offsetTop = y1 < y2 ? y1 : y2;

    var line =  $('<div>')
                .appendTo(document.body)
                .addClass('line')
                .css({
                    'position':'absolute',
                    'transform':transform
                })
                .width(length)
                .offset({left:offsetLeft, top:offsetTop});
    return line;
}

$(function() {
    var nodeNbrs = [];
    var cursorX = 500;
    var cursorY = 300;
    var mousedown = false;
    var movingNodeID = -1;

    var cmdDown = false;
    var existsSelectedNode = false;
    var selectedNodeID = -1;
    var selectedNodeX = 0;
    var selectedNodeY = 0;

    var ghostNode = $('<div class="node-ghost" id="node-ghost">');

    var nodeCounter = 0;
    $('.node').draggable();
    $(window).click(function(e) {
        cursorX = e.pageX;
        cursorY = e.pageY;

        var shiftKeyPressed = window.event.shiftKey;
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
            node.draggable();
            nodeCounter++;
            nodeNbrs.push([]);
        }
    });

    $(document).on('keydown', function(e) {
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
        else if (e.keyCode == 91) {
            cmdDown = true;
        }
    });
    $(document).on('keyup', function(e) {
        if (e.keyCode == 16) {
            console.log('shift up');
            ghostNode.remove();
        } else if (e.keyCode == 91) {
            cmdDown = false;
        }
    });
    $(document).on('mousemove', function(e) {
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
        } else if (window.event.shiftKey) {
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

    $(document).on('click', '.node', function() {
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
                    line = createLine(selectedNodeX, selectedNodeY, currNodeX, currNodeY);
                    line.attr('id', lineID);
                    
                    // update data structure
                    nodeNbrs[currNodeID].push(selectedNodeID);
                    nodeNbrs[selectedNodeID].push(currNodeID);
                    console.log(nodeNbrs);

                    $('.node').removeClass('selected');
                    existsSelectedNode = false;
                    selectedNodeID = -1;
                    selectedNodeX = 0;
                    selectedNodeY = 0;
                }
            }
        }
    });

});
