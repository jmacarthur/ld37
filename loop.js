var canvas = document.getElementsByTagName('canvas')[0];
var ctx = null;
var body = document.getElementsByTagName('body')[0];
var keysDown = new Array();
var SCREENWIDTH  = 640;
var SCREENHEIGHT = 480;
var MODE_TITLE = 0;
var MODE_PLAY  = 1;
var MODE_WIN   = 2;

var x = 0, y = 0, dx = 4, dy=4;
var ballRadius = 32;
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

function TaggedPoly(ident, pointarray, region) {
    this.poly = pointarray;
    this.region = region;
    this.ident = ident;
    this.alive = true;
}

function loadFragments()
{
    fragments = new Array();
    outline = new Array();
    colours = new Array();
    borderColours = new Array();

    totalFragments = 0;

    lineArray = [ "171.445210,58.112124 0.035655,229.521680 471.411930,700.897960 985.640600,229.521680 814.231040,58.112124" ];
    
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

function TaggedPoint(coords, polygon, pointid)
{
    this.x1 = coords[0];
    this.y1 = coords[1];
    this.ident = polygon.ident+"-"+pointid;
    this.polygon = polygon
}


function TaggedLine(x1, y1, x2, y2, polygon, lineid){
    this.x1 = x1;
    this.x2 = x2;
    this.y1 = y1;
    this.y2 = y2;
    this.polygon = polygon;
    this.ident = polygon.ident+"-l"+lineid;
}

function TaggedPoly(ident, pointarray, region) {
    this.poly = pointarray;
    this.region = region;
    this.ident = ident;
    this.alive = true;
}


function getTaggedPolyLines(taggedPolygon)
{
    lines = new Array();
    poly = taggedPolygon.poly;
    for(p=0;p<poly.length-1;p++) {
        lines.push(new TaggedLine(poly[p][0],poly[p][1],poly[p+1][0],poly[p+1][1],taggedPolygon,p));
    }
    lines.push(new TaggedLine(poly[0][0],poly[0][1],poly[poly.length-1][0],poly[poly.length-1][1],taggedPolygon,p));
    return lines;
}

function Collision(ix,iy,dist,outAngle,obj)
{
    this.ix = ix;
    this.iy = iy;
    this.dist = dist;
    this.outAngle = outAngle;
    this.obj = obj;
}

function intersectPoly(poly, collisions, ball, considerRadius, lastCollisionObjectID)
{
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
        dist = lineLen(dx,dy);
        dx = dist*Math.cos(closest.outAngle);
        dy = dist*Math.sin(closest.outAngle);
	console.log("Moving to "+x+","+y+" with vel "+dx+","+dy);
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
