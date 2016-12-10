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
