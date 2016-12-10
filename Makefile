box2d: adventure_golf.ts
	tsc --outFile loop.js adventure_golf.ts

loop.js: loop.ts physics.ts
	tsc --outFile loop.js loop.ts physics.ts

