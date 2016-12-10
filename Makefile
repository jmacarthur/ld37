box2d: seesaw.ts
	tsc --outFile loop.js seesaw.ts

loop.js: loop.ts physics.ts
	tsc --outFile loop.js loop.ts physics.ts

