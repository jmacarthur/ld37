/// <reference path="physics.ts" />

var canvas = document.getElementsByTagName('canvas')[0];
var ctx = null;
var body = document.getElementsByTagName('body')[0];
var keysDown = new Array();
var SCREENWIDTH  = 640;
var SCREENHEIGHT = 480;
var MODE_TITLE = 0;
var MODE_PLAY  = 1;
var MODE_WIN   = 2;

var x = 0, y = 0, dx = 3, dy=4;
var ballRadius = 32;
var bitfont;
var titlectx;
var titleBitmap;
var fragments : Array<TaggedPoly>;

function getImage(name)
{
    var image = new Image();
    image.src = 'graphics/'+name+'.png';
    return image;
}

function drawChar(context, c, x, y) 
{
    c = c.charCodeAt(0);
    if(c > 0) {
        context.drawImage(bitfont, c*6, 0, 6,8, x, y, 12, 16);
    }
}

function drawString(context, string, x, y) {
    string = string.toUpperCase();
    for(var i = 0; i < string.length; i++) {
	drawChar(context, string[i], x, y);
	x += 12;
    }
}

function paintTitleBitmaps()
{
    drawString(titlectx, 'This is a demo of the JavaScript/HTML5 game loop',32,32);
    drawString(winctx, 'Your game should always have an ending',32,32);
}

function makeTitleBitmaps()
{
    titleBitmap = document.createElement('canvas');
    titleBitmap.width = SCREENWIDTH;
    titleBitmap.height = SCREENHEIGHT;
    titlectx = titleBitmap.getContext('2d');
    winBitmap = document.createElement('canvas');
    winBitmap.width = SCREENWIDTH;
    winBitmap.height = SCREENHEIGHT;
    winctx = winBitmap.getContext('2d');
    bitfont = new Image();
    bitfont.src = "graphics/bitfont.png";
    bitfont.onload = paintTitleBitmaps;
}

function resetGame()
{
    x = 128;
    y = 128;
}

function loadPolygon(line)
{
    poly = new Array();
    scale = 0.5;
    pointArray = line.split(" ");
    for(var p=0;p < pointArray.length;p++) {
	point = pointArray[p];
	xy = point.split(",");
	// polygons are specified on a 1-1000 scale.
	poly.push([(xy[0]-500)*scale+320, xy[1]*scale]); 
    }
    return poly;
}

function loadFragments()
{
    fragments = new Array();
    outline = new Array();
    colours = new Array();
    borderColours = new Array();

    totalFragments = 0;

    lineArray = [ "200,50 0,500 30,700 800,800 985,400 815,20" ];
    
    for(var l = 0;l< lineArray.length; l++) {
	line = lineArray[l];
	poly = loadPolygon(line);
	outline.push(new TaggedPoly("outline"+l, poly, null));
	fragments.push(new TaggedPoly("outline"+l, poly, null));
    }
}


function init()
{
    mode = MODE_TITLE;
    playerImage = getImage("ball");
    springSound = new Audio("audio/boing.wav");
    makeTitleBitmaps();
    nextRoom();
    return true;
}

function nextRoom()
{
    loadFragments();
}

function drawOutline()
{
    
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.strokeWidth=4;
    for(f=0;f<outline.length;f++) {
	poly = outline[f].poly;
	ctx.moveTo(poly[0][0], poly[0][1]);
	for(p=1;p<poly.length;p++) {
	    point = poly[p];
	    ctx.lineTo(point[0], point[1]);
	}
    }
    ctx.closePath();
    ctx.fill();
}


function draw() {
    ctx.fillStyle = "#0000ff";
    ctx.fillRect(0, 0, SCREENWIDTH, SCREENHEIGHT);

    if(mode == MODE_TITLE) {
	ctx.drawImage(titleBitmap, 0, 0);
	return;
    }

    drawOutline();
    ctx.drawImage(playerImage, x-32, y-32);

    if(mode == MODE_WIN) {
	ctx.drawImage(winBitmap, 0, 0);
    }
}

function processKeys() {
    if(keysDown[40] || keysDown[83]) y += 4;
    if(keysDown[38] || keysDown[87]) y -= 4;
    if(keysDown[37] || keysDown[65]) x -= 4;
    if(keysDown[39] || keysDown[68]) x += 4;

    gamepads = navigator.getGamepads();
    for(var i=0;i<gamepads.length;i++) {
	if(gamepads[i] != null) {
	    console.log("checking gamepad "+i+" button 0: "+gamepads[i].buttons[0].pressed);
	    if(gamepads[i].buttons[0].pressed) x+=4;
	}
    }

    
    if(x < 0) x = 0;
    if(x > SCREENWIDTH - playerImage.width)  x = SCREENHEIGHT - playerImage.width;
    if(y < 0) y = 0;
    if(y > SCREENWIDTH - playerImage.height) y = SCREENHEIGHT - playerImage.height;
}


function animate()
{
    if(x > SCREENWIDTH || x<0) { dx = -dx; wallSound.play(); }
    if(y > SCREENHEIGHT || y<0) { dy = -dy; if(gameOverTimeout==0) wallSound.play(); }

    var ball = { 'x': x, 'y': y, 'dx': dx, 'dy': dy, 'radius': ballRadius };
    collisions = new Array();
    closest = null;
    lastCollisionObjectID = null;
    {
	for(f=0;f<fragments.length;f++) {
	    poly = fragments[f];
	    lastCollisionObjectID = "";
	    intersectPoly(poly, collisions, ball, 1, lastCollisionObjectID);
	}
	
	points = new Array();
	for(f=0;f<fragments.length;f++) {
	    poly = fragments[f];
	    if(poly.alive == false) continue;
	    for(p=0;p<poly.poly.length;p++) {
		points.push(new TaggedPoint(poly.poly[p], poly, p));
	    }	
	}
	
	intersectVertices(points, collisions, ball.x,ball.y,ball.dx,ball.dy, ball.radius,lastCollisionObjectID)
	closestDist = 1.1;
	
	for(c=0;c<collisions.length;c++) {
	    col = collisions[c];
	    console.log(col.ix, col.iy, col.dist, col.outAngle);
	    if(col.dist < closestDist) {
		closest = col;
		closestDist = col.dist;
	    }
	}
    }
    
    if(closest != null) {
        console.log("Identified collision as "+closest.obj.ident+" at dist "+closestDist);
	ctx.beginPath();
	ctx.moveTo(x,y);
	x = closest.ix;
        y = closest.iy;
        dist = lineLen(dx,dy)*0.9;
        dx = dist*Math.cos(closest.outAngle);
        dy = dist*Math.sin(closest.outAngle);
	console.log("Moving to "+x+","+y+" with vel "+dx+","+dy+"; dist = "+dist);
	// TODO: At the moment we only do one collision per check - we could get into trouble this way...
	ctx.lineTo(x,y);
	ctx.stroke();
	{
	    closest.obj.alive = false;

	} 
    } else {
	x += dx;
	y += dy;
    }

    // Gravity field
    dy += 0.1;


}

function drawRepeat() {
    if(mode != MODE_TITLE) {
	processKeys();
	animate();
    }
    draw();
    if(!stopRunloop) setTimeout('drawRepeat()',20);
}

window.addEventListener("gamepadconnected", function(e) {
    console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
		e.gamepad.index, e.gamepad.id,
		e.gamepad.buttons.length, e.gamepad.axes.length);
});

window.addEventListener("gamepaddisconnected", function(e) {
    console.log("Gamepad disconnected from index %d: %s",
		e.gamepad.index, e.gamepad.id);
});

if (canvas.getContext('2d')) {
    stopRunloop = false;
    ctx = canvas.getContext('2d');
    body.onkeydown = function (event) {
	var c = event.keyCode;
        keysDown[c] = 1;
	if(c == 81) {
	    stopRunloop=true;
	}
	if(c == 32) {
	    if(mode == MODE_TITLE) {
		resetGame();
		mode = MODE_PLAY;
	    }
	}
	if(c == 82) {
	    if(mode == MODE_WIN) {
		mode = MODE_TITLE;
	    }
	}
    };

    body.onkeyup = function (event) {
	var c = event.keyCode;
        keysDown[c] = 0;
    };

    if(init()) {      
      drawRepeat();
    }
}
