var canvas = document.getElementsByTagName('canvas')[0];
var ctx = null;
var body = document.getElementsByTagName('body')[0];
var keysDown = new Array();
var SCREENWIDTH  = 640;
var SCREENHEIGHT = 480;
var MODE_TITLE = 0;
var MODE_PLAY  = 1;
var MODE_WIN   = 2;

function getImage(name)
{
    image = new Image();
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
    for(i = 0; i < string.length; i++) {
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

function init()
{
    mode = MODE_TITLE;
    playerImage = getImage("player");
    springSound = new Audio("audio/boing.wav");
    makeTitleBitmaps();
    return true;
}

function draw() {
    ctx.fillStyle = "#0000ff";
    ctx.fillRect(0, 0, SCREENWIDTH, SCREENHEIGHT);

    if(mode == MODE_TITLE) {
	ctx.drawImage(titleBitmap, 0, 0);
	return;
    }

    ctx.drawImage(playerImage, x, y);

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

function degrees(r) {
    return r*(180/Math.PI);
}

function radians(r) {
    return r*(Math.PI/180);
}


function lineIntersection(ballx, bally, ballxv, ballyv,
			  lstartx, lstarty, lxv, lyv)
{
    j = (lstarty/ballyv - bally/ballyv + ballx/ballxv -lstartx/ballxv)/(lxv/ballxv -lyv/ballyv);
    i = (lstartx+j*lxv-ballx)/ballxv;
    return [i,j];
}

function lineLen(x,y)
{
    return Math.sqrt(x*x+y*y);
}


function intersectPoly(poly, collisions, ball, considerRadius, lastCollisionObjectID)
{
    if(!poly.alive) return;
    lines = getTaggedPolyLines(poly);
    hitline = null;
    lowi = 1.1;

    for(ln=0;ln<lines.length;ln++) {
	l = lines[ln]
        if(l.ident == lastCollisionObjectID) continue;
        lxv = l.x2-l.x1;
	lyv = l.y2-l.y1;
	lnormx = -lyv;
        lnormy = lxv;
        normScale = lineLen(lnormx,lnormy);
        lnormx = lnormx / normScale;
        lnormy = lnormy / normScale;
        dotproduct = lnormx*ball.dx+lnormy*ball.dy;
        if(dotproduct>0) {
            lnormx = -lnormx;
            lnormy = -lnormy;
	}
        if(considerRadius) {              
            // Make a parallel line
            lstartx = l.x1+lnormx*ball.radius;
            lstarty = l.y1+lnormy*ball.radius;
	}
        else {
            lstartx = l.x1;
            lstarty = l.y1;
	}
	
        res = lineIntersection(ball.x,ball.y,ball.dx,ball.dy,
                               lstartx,lstarty,lxv,lyv);
        i = res[0];
	j = res[1];
        if(i>=0 && i<=1 && j>=0 && j<=1) {
            if(i<lowi) {
                lowi = i;
                hitline = l;
	    }
	}
	
        }
    if(hitline != null) {
	// Ok, now we can figure out the angle wrt the surface normal...
        lxv = hitline.x2 - hitline.x1;
        lyv = hitline.y2 - hitline.y1;
	
        lnormx = -lyv;
        lnormy = lxv;
        normScale = Math.sqrt(lnormx*lnormx+lnormy*lnormy);
        lnormx = lnormx / normScale;
        lnormy = lnormy / normScale;
        dotproduct = lnormx*ball.dx+lnormy*ball.dy;
	// This time, we make the normal in the same direction as the ball vector
        if(dotproduct<0) {
	    lnormx = -lnormx;
	    lnormy = -lnormy;
	}
        lenNormal = 1.0;
        ballToIntersectX = lowi*ball.dx;
        ballToIntersectY = lowi*ball.dy;
        distToIntersect = Math.sqrt(ballToIntersectX*ballToIntersectX
                                    +ballToIntersectY*ballToIntersectY);
        ballToIntersectX /= distToIntersect;
        ballToIntersectY /= distToIntersect;
        angle = Math.acos(ballToIntersectX*lnormx+ballToIntersectY*lnormy);
        console.log("Collision is at "+degrees(angle)+" degrees to surface normal");
        normAngle = Math.atan2(lnormy,lnormx)+Math.PI;
        incident = Math.atan2(ball.dy,ball.dx)+Math.PI;
        angle =  incident - normAngle;
        
        outangle = normAngle - angle;
	
        //if(poly.region.collide == False) {
        //    outangle = incident - Math.PI;
	//}
        collisions.push(new Collision(ball.x + lowi*ball.dx, ball.y+lowi*ball.dy, lowi, outangle,poly));
	console.log("Intersection with polygon "+poly.ident+" line "+hitline.ident);
    }
}

function checkClosestApproach(point, startx, starty, dx, dy)
{
    normx = -dy;
    normy = dx;
    res = lineIntersection(startx,starty,dx,dy,
                             point.x1,point.y1,normx,normy);
    i = res[0]; j = res[1];
    dist = Math.abs(j*lineLen(normx,normy));
    return [dist,i];
}
function intersectVertices(points, collisions, ballx,bally,ballxv,ballyv, ballRadius,lastCollisionObjectID)
{
    for(pointindex=0;pointindex<points.length;pointindex++) {
	p = points[pointindex];
        if(p.ident == lastCollisionObjectID) continue;
        res = checkClosestApproach(p,ballx,bally,ballxv,ballyv);

	d = res[0]; i = res[1];
        if(d<ballRadius) {
            diff = ballRadius - d;
            dist = Math.sqrt(ballRadius*ballRadius-d*d);
            iPoint = (lineLen(ballxv,ballyv)*i-dist)/lineLen(ballxv,ballyv); // Distance to intersect
            if(iPoint >=0 && iPoint <=1) {
                ix = ballx+ballxv*iPoint;
                iy = bally+ballyv*iPoint;
                radiusAng = Math.atan2(iy-p.y1,ix-p.x1);
                incident = Math.atan2(ballyv,ballxv)+Math.PI;
                angle =  incident - radiusAng;
                console.log("Collides with ident "+p.ident+" Incident angle = "+degrees(incident));
                console.log("Surface normal angle = "+degrees(radiusAng));
                outangle = radiusAng - angle;
		// Horrible way to get the polygon of this point by parsing the ident...
		split = p.ident.indexOf("-");
		polyNum = p.ident.slice(4,split);
                collisions.push(new Collision(ix,iy, iPoint, outangle, fragments[polyNum]))
	    }
	}
    }
}

function drawRepeat() {
    if(mode != MODE_TITLE) {
	processKeys();
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
