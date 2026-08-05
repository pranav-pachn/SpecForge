const fs = require('fs');
const path = require('path');
const srcDir = path.join(__dirname, '../src');
const rootDir = path.join(__dirname, '..');

// Move lib/intelligence/memory/* to intelligence/memory/
const oldMemDir = path.join(srcDir, 'lib/intelligence/memory');
const newMemDir = path.join(srcDir, 'intelligence/memory');
if (fs.existsSync(oldMemDir)) {
  fs.readdirSync(oldMemDir).forEach(file => {
    fs.renameSync(path.join(oldMemDir, file), path.join(newMemDir, file));
    console.log(`Moved ${file} to intelligence/memory`);
  });
  fs.rmdirSync(oldMemDir);
}

function fix(filePath, replacements) {
  const fullPath = path.join(rootDir, filePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  let newContent = content;
  for (const {from, to} of replacements) {
    if (typeof from === 'string') {
      newContent = newContent.split(from).join(to);
    } else {
      newContent = newContent.replace(from, to);
    }
  }
  if (content !== newContent) {
    fs.writeFileSync(fullPath, newContent, 'utf8');
    console.log(`Fixed ${filePath}`);
  }
}

fix('src/app/api/workflows/[id]/coverage/route.ts', [
  { from: "'../../../../../lib/intelligence/validation/CoverageEngine'", to: "'@/intelligence/validation/CoverageEngine'" }
]);

fix('src/intelligence/memory/MemoryEngine.ts', [
  { from: "'../intelligence/graph/GraphService'", to: "'../graph/GraphService'" },
  { from: "'../intelligence/IntelligenceFacade'", to: "'../IntelligenceFacade'" }
]);

fix('src/intelligence/memory/MemoryStore.ts', [
  { from: "'../intelligence/memory/MemoryConsolidator'", to: "'./MemoryConsolidator'" }
]);

fix('src/lib/ai/engine/persistArtifacts.ts', [
  { from: "'../../../lib/memory/MemoryEngine'", to: "'@/intelligence/memory/MemoryEngine'" },
  { from: "'../../../lib/intelligence/graph/GraphBuilder'", to: "'@/intelligence/graph/GraphBuilder'" }
]);

fix('src/intelligence/memory/DecisionQuery.ts', [
  { from: "'../graph/GraphService'", to: "'../graph/GraphService'" },
  { from: "'../graph/NodeTypes'", to: "'../graph/NodeTypes'" }
]);

fix('testDrift.ts', [
  { from: "'./src/lib/memory/DriftEngine'", to: "'./src/intelligence/drift/DriftEngine'" }
]);

fix('testImpact.ts', [
  { from: "'./src/lib/memory/ImpactAnalyzer'", to: "'./src/intelligence/impact/ImpactAnalyzer'" }
]);

fix('testMemory.ts', [
  { from: "'./src/lib/memory/MemoryEngine'", to: "'./src/intelligence/memory/MemoryEngine'" }
]);

// Implicit any fixes
fix('src/app/api/workflows/[id]/copilot/route.ts', [
  { from: "messages.map(m =>", to: "messages.map((m: any) =>" },
  { from: "contextDocs.map(m =>", to: "contextDocs.map((m: any) =>" }
]);

fix('src/lib/ai/engine/persistArtifacts.ts', [
  { from: ".catch(e => {", to: ".catch((e: any) => {" }
]);
