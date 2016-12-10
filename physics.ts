function degrees(r) {
    return r*(180/Math.PI);
}

function radians(r) {
    return r*(Math.PI/180);
}

function lineIntersection(ballx, bally, ballxv, ballyv,
			  lstartx, lstarty, lxv, lyv) : Array<number>
{
    var j = (lstarty/ballyv - bally/ballyv + ballx/ballxv -lstartx/ballxv)/(lxv/ballxv -lyv/ballyv);
    var i = (lstartx+j*lxv-ballx)/ballxv;
    return [i,j];
}

function lineLen(x,y)
{
    return Math.sqrt(x*x+y*y);
}

class TaggedPoint {
    x1: number;
    y1: number;
    ident: string;
    polygon: TaggedPoly;
    constructor(coords, polygon, pointid) {
	this.x1 = coords[0];
	this.y1 = coords[1];
	this.ident = polygon.ident+"-"+pointid;
	this.polygon = polygon
    }
}

class TaggedLine {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
    polygon: TaggedPoly;
    ident: string;
    
    constructor(x1, y1, x2, y2, polygon, lineid) {
	this.x1 = x1;
	this.x2 = x2;
	this.y1 = y1;
	this.y2 = y2;
	this.polygon = polygon;
	this.ident = polygon.ident+"-l"+lineid;
    }
}

class TaggedPoly {
    poly: Array<Array<number>>;
    region: any;
    ident: string;
    alive: boolean;
    
    constructor(ident, pointarray, region) {
	this.poly = pointarray;
	this.region = region;
	this.ident = ident;
	this.alive = true;
    }
}

function getTaggedPolyLines(taggedPolygon) : Array<TaggedLine>
{
    var lines: Array<TaggedLine> = new Array();
    var poly = taggedPolygon.poly;
    for(var p=0;p<poly.length-1;p++) {
        lines.push(new TaggedLine(poly[p][0],poly[p][1],poly[p+1][0],poly[p+1][1],taggedPolygon,p));
    }
    lines.push(new TaggedLine(poly[0][0],poly[0][1],poly[poly.length-1][0],poly[poly.length-1][1],taggedPolygon,p));
    return lines;
}

class Collision {
    ix : number;
    iy : number;
    dist: number;
    outAngle: number;
    obj: number;
    constructor(ix,iy,dist,outAngle,obj)
    {
	this.ix = ix;
	this.iy = iy;
	this.dist = dist;
	this.outAngle = outAngle;
	this.obj = obj;
    }
}

function intersectPoly(poly, collisions, ball, considerRadius, lastCollisionObjectID)
{
    var lines = getTaggedPolyLines(poly);
    var hitline = null;
    var lowi = 1.1;

    for(var ln=0;ln<lines.length;ln++) {
	var l = lines[ln]
        if(l.ident == lastCollisionObjectID) continue;
        var lxv = l.x2-l.x1;
	var lyv = l.y2-l.y1;
	var lnormx = -lyv;
        var lnormy = lxv;
        var normScale = lineLen(lnormx,lnormy);
        var lnormx = lnormx / normScale;
        var lnormy = lnormy / normScale;
        var dotproduct = lnormx*ball.dx+lnormy*ball.dy;
	var lstartx;
	var lstarty;
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
	
        var res = lineIntersection(ball.x,ball.y,ball.dx,ball.dy,
				   lstartx,lstarty,lxv,lyv);
        var i = res[0];
	var j = res[1];
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
        var lenNormal = 1.0;
        var ballToIntersectX = lowi*ball.dx;
        var ballToIntersectY = lowi*ball.dy;
        var distToIntersect = Math.sqrt(ballToIntersectX*ballToIntersectX
                                    +ballToIntersectY*ballToIntersectY);
        ballToIntersectX /= distToIntersect;
        ballToIntersectY /= distToIntersect;
        var angle = Math.acos(ballToIntersectX*lnormx+ballToIntersectY*lnormy);
        console.log("Collision is at "+degrees(angle)+" degrees to surface normal");
        var normAngle = Math.atan2(lnormy,lnormx)+Math.PI;
        var incident = Math.atan2(ball.dy,ball.dx)+Math.PI;
        var angle =  incident - normAngle;
        var outangle = normAngle - angle;
	
        //if(poly.region.collide == False) {
        //    outangle = incident - Math.PI;
	//}
        collisions.push(new Collision(ball.x + lowi*ball.dx, ball.y+lowi*ball.dy, lowi, outangle,poly));
	console.log("Intersection with polygon "+poly.ident+" line "+hitline.ident);
    }
}

function checkClosestApproach(point: TaggedPoint, startx: number, starty: number, dx: number, dy: number)
{
    var normx = -dy;
    var normy = dx;
    var res = lineIntersection(startx,starty,dx,dy,
                             point.x1,point.y1,normx,normy);
    var i = res[0];
    var j = res[1];
    var dist = Math.abs(j*lineLen(normx,normy));
    return [dist,i];
}

function intersectVertices(points : Array<TaggedPoint>, collisions: Array<Collision>, ballx,bally,ballxv,ballyv, ballRadius,lastCollisionObjectID) : void
{
    for(var pointindex=0;pointindex<points.length;pointindex++) {
	var p : TaggedPoint = points[pointindex];
        if(p.ident == lastCollisionObjectID) continue;
        var res = checkClosestApproach(p,ballx,bally,ballxv,ballyv);

	var d = res[0];
	var i = res[1];
        if(d<ballRadius) {
            var diff = ballRadius - d;
            var dist = Math.sqrt(ballRadius*ballRadius-d*d);
            var iPoint : number = (lineLen(ballxv,ballyv)*i-dist)/lineLen(ballxv,ballyv); // Distance to intersect
            if(iPoint >=0 && iPoint <=1) {
                var ix : number = ballx+ballxv*iPoint;
                var iy : number = bally+ballyv*iPoint;
                var radiusAng = Math.atan2(iy-p.y1,ix-p.x1);
                var incident = Math.atan2(ballyv,ballxv)+Math.PI;
                var angle =  incident - radiusAng;
                console.log("Collides with ident "+p.ident+" Incident angle = "+degrees(incident));
                console.log("Surface normal angle = "+degrees(radiusAng));
                var outangle = radiusAng - angle;
                collisions.push(new Collision(ix,iy, iPoint, outangle, p.polygon))
	    }
	}
    }
}
