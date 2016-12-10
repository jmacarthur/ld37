box2d: adventure_golf.ts draw_world.ts
	tsc --outFile loop.js adventure_golf.ts draw_world.ts

loop.js: loop.ts physics.ts
	tsc --outFile loop.js loop.ts physics.ts

