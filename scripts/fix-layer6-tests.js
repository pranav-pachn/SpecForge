const fs = require('fs');
const path = require('path');
const rootDir = path.join(__dirname, '..');

let td = fs.readFileSync(path.join(rootDir, 'testDrift.ts'), 'utf8');
td = td.replace("'./src/intelligence/drift/DriftEngine'", "'./src/intelligence/memory/DriftEngine'");
fs.writeFileSync(path.join(rootDir, 'testDrift.ts'), td, 'utf8');

let ti = fs.readFileSync(path.join(rootDir, 'testImpact.ts'), 'utf8');
ti = ti.replace("'./src/intelligence/impact/ImpactAnalyzer'", "'./src/intelligence/memory/ImpactAnalyzer'");
fs.writeFileSync(path.join(rootDir, 'testImpact.ts'), ti, 'utf8');

console.log("Fixed test references.");
