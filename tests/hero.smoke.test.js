const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const htmlPath = path.join(projectRoot, 'index.html');

const html = fs.readFileSync(htmlPath, 'utf-8');

const hasHeroHeadline = /Learn Docker from Scratch/i.test(html);
const hasHeroCanvas = /id\s*=\s*"hero-canvas"/i.test(html);
const hasHeroFallback = /id\s*=\s*"hero-fallback"/i.test(html);

if (!hasHeroHeadline) {
    throw new Error('Hero headline is missing from index.html');
}

if (!hasHeroCanvas && !hasHeroFallback) {
    throw new Error('Hero section must include either the canvas or fallback image markup.');
}

console.log('Hero smoke test passed: headline plus canvas/fallback markup detected.');
