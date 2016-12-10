/// <reference path="draw_world.ts" />
/// <reference path="leveldata.ts" />

var b2CircleDef;
var b2BodyDef;
var b2PolyDef;

var b2RevoluteJointDef;
var $;

var b2BoxDef;
var b2AABB;
var b2Vec2;
var b2World;
var ball;
var ballBd;
var ballShape;
var direction : number = 90;
var playerImage;
var levelData;
var SCREENWIDTH = 640;
var SCREENHEIGHT = 480;
var currentLevelName = "Entryway";

function getImage(name)
{
    var image = new Image();
    image.src = 'graphics/'+name+'.png';
    return image;
}


class Pos {
    x: number;
    y: number;
}

function radians(r) {
    return r*(Math.PI/180);
}

function drawWorld(world, context) {
    ctx.fillStyle = "#0000c0";
    ctx.fillRect(0, 0, SCREENWIDTH, SCREENHEIGHT);

    for (var b = world.m_bodyList; b; b = b.m_next) {
	for (var s = b.GetShapeList(); s != null; s = s.GetNext()) {
	    // I don't know why, but if we don't call this, the game slows down enormously
	    drawShape(s, context);
	}
    }
    var pos = ball.GetCenterPosition();
    context.drawImage(playerImage, pos.x-32, pos.y-32);
    context.moveTo(pos.x, pos.y);
    context.lineTo(pos.x + 64*Math.cos(radians(direction)), pos.y+64*Math.sin(radians(direction)));
    context.stroke();

    context.fillStyle = 'white';
    for(var l = 0;l< levelData.length; l++) {
	var line : string = levelData[l];
	for (var x =0;x<line.length;x++) {
	    if(line[x] == '#') {
		context.rect(x*64, l*64, 64, 64);
		context.fill();
	    }
	}
    }

}

function createBox(world, x, y, width, height, fixed = false) {
    if (typeof(fixed) == 'undefined') fixed = true;
    var boxSd = new b2BoxDef();
    if (!fixed) boxSd.density = 1.0;
    boxSd.extents.Set(width, height);
    var boxBd = new b2BodyDef();
    boxBd.AddShape(boxSd);
    boxBd.position.Set(x,y);
    return world.CreateBody(boxBd)
}

function createBall(world, x, y, rad, fixed = false, density = 1.0) {
    ballShape = new b2CircleDef();
    if (!fixed) ballShape.density = density;
    ballShape.radius = rad || 10;
    ballShape.restitution = 0.2;
    ballBd = new b2BodyDef();
    ballBd.AddShape(ballShape);
    ballBd.position.Set(x,y);
    return world.CreateBody(ballBd);
};

function createPoly(world, x, y, points, fixed = false) {
    var polySd = new b2PolyDef();
    if (!fixed) polySd.density = 1.0;
    polySd.vertexCount = points.length;
    for (var i = 0; i < points.length; i++) {
	polySd.vertices[i].Set(points[i][0], points[i][1]);
    }
    var polyBd = new b2BodyDef();
    polyBd.AddShape(polySd);
    polyBd.position.Set(x,y);
    return world.CreateBody(polyBd)
};

function pin(body1, body2, pos : Pos)
{
    var jointDef = new b2RevoluteJointDef();
    jointDef.body1 = body1;
    jointDef.body2 = body2;
    jointDef.anchorPoint = pos;
    world.CreateJoint(jointDef);
}

function initWorld(world) {
    var pendulum = createBox(world, 150, 160, 20, 20, false);
    pin (pendulum, world.GetGroundBody(), pendulum.GetCenterPosition());
    var gradient = createPoly(world, 200, 200, [[0, 0], [200, -30], [200, 30]], true);
};

var initId = 0;
var world;
var ctx;
var canvasWidth;
var canvasHeight;
var canvasTop;
var canvasLeft;
var ballStartPos;
function processKeys() {
    if(keysDown[37] || keysDown[65]) direction -= 4;
    if(keysDown[39] || keysDown[68]) direction += 4;
}

function changeScreens() {
    var pos = ball.GetCenterPosition();
    if(pos.y<32 && levels[currentLevelName].n_to !== undefined) {
	ballStartPos = new b2Vec2(pos.x, 512-32-8);
	currentLevelName = levels[currentLevelName].n_to;
	resetLevel();
	return;
    }
    if(pos.y>512 && levels[currentLevelName].s_to !== undefined) {
	ballStartPos = new b2Vec2(pos.x, 32+8);
	currentLevelName = levels[currentLevelName].s_to;
	resetLevel();
	return;
    }
    if(pos.x>512 && levels[currentLevelName].e_to !== undefined) {
	ballStartPos = new b2Vec2(32+8,pos.y);
	currentLevelName = levels[currentLevelName].e_to;
	resetLevel();
	return;
    }
    if(pos.x < 32 && levels[currentLevelName].w_to !== undefined) {
	ballStartPos = new b2Vec2(512-38-8, pos.y)
	currentLevelName = levels[currentLevelName].w_to;
	resetLevel();
	return;
    }
}

function step(cnt) {
    var stepping = false;
    var timeStep = 1.0/60;
    var iteration = 1;
    world.Step(timeStep, iteration);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    drawWorld(world, ctx);
    processKeys();
    changeScreens();
    setTimeout('step(' + (cnt || 0) + ')', 10);
}

var canvas = document.getElementsByTagName('canvas')[0];
var body = document.getElementsByTagName('body')[0];

var keysDown: boolean [];
keysDown = new Array<boolean>();

if (canvas.getContext('2d')) {
    ctx = canvas.getContext('2d');
    body.onkeydown = function (event) {
	var c = event.keyCode;
	keysDown[c] = true;
	if(c == 81) {
	    console.log("Quit!");
	}
	if(c == 32) {
	    // Impulse is divided by mass, so needs to be large.
	    var power = 500000;
	    ball.ApplyImpulse( new b2Vec2(power*Math.cos(radians(direction)), power*Math.sin(radians(direction))), ball.GetCenterPosition() );
	}
	if(c == 78) {
	    console.log("Changing level");
	    currentLevelName = "Kitchen";
	    resetLevel();
	}
	
    }
    body.onkeyup = function (event) {
	var c = event.keyCode;
	keysDown[c] = false;
    }
}
    
function addLevelBoxes(levelData : Array<string>, world:any) : void
{
    for(var l = 0;l< levelData.length; l++) {
	var line : string = levelData[l];
	for (var x =0;x<line.length;x++) {
	    if(line[x] == '#') {
		createBox(world, x*64+32, l*64+32, 32, 32, true);
	    }
	}
    }
}
    
function createWorld() {
    var worldAABB = new b2AABB();
    worldAABB.minVertex.Set(-1000, -1000);
    worldAABB.maxVertex.Set(1000, 1000);
    var gravity = new b2Vec2(0, 1);
    var doSleep = true;
    var world = new b2World(worldAABB, gravity, doSleep);

    levelData = levels[currentLevelName].map;
    
    addLevelBoxes(levelData, world)

    createGround(world);

    ball = createBall(world, ballStartPos.x, ballStartPos.y, 32, false, 1.0);

    return world;
}

function createGround(world) {
    var groundSd = new b2BoxDef();
    groundSd.extents.Set(1000, 50);
    groundSd.restitution = 0.2;
    var groundBd = new b2BodyDef();
    groundBd.AddShape(groundSd);
    groundBd.position.Set(-500, 900);
    return world.CreateBody(groundBd)
}

function resetLevel(): void
{
    world = createWorld();
    initWorld(world);
}

function firstTimeInit(): void
{
    ballStartPos = new b2Vec2(320,96);
}

var world;
window.onload=function() {
    firstTimeInit();
    world = createWorld();
    initWorld(world);
    playerImage = getImage("ball");
    ctx = $('canvas').getContext('2d');
    var canvasElm = $('canvas');
    canvasWidth = parseInt(canvasElm.width);
    canvasHeight = parseInt(canvasElm.height);
    canvasTop = parseInt(canvasElm.style.top);
    canvasLeft = parseInt(canvasElm.style.left);
    canvas.addEventListener('click', function(e) {
    });
    canvas.addEventListener('contextmenu', function(e) {
	/* Right click - does nothing. */
	console.log("Right click");
	return false;
    });
    step(0);
};
