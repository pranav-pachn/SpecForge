const fs = require('fs');
const path = require('path');
const srcDir = path.join(__dirname, '../src');
const rootDir = path.join(__dirname, '..');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
      arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles);
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        arrayOfFiles.push(path.join(dirPath, file));
      }
    }
  });
  return arrayOfFiles;
}

const files = getAllFiles(srcDir);
['testDrift.ts', 'testImpact.ts', 'testMemory.ts'].forEach(f => {
  if (fs.existsSync(path.join(rootDir, f))) {
    files.push(path.join(rootDir, f));
  }
});

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // CoverageEngine route
  content = content.replace(/['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/lib\/intelligence\/validation\/CoverageEngine['"]/g, "'@/intelligence/validation/CoverageEngine'");
  
  // Memory route
  content = content.replace(/['"]@\/lib\/intelligence\/memory\/DecisionQuery['"]/g, "'@/intelligence/memory/DecisionQuery'");

  // MemoryEngine
  if (file.includes('MemoryEngine.ts')) {
    content = content.replace(/['"]\.\.\/intelligence\/graph\/GraphService['"]/g, "'../graph/GraphService'");
    content = content.replace(/['"]\.\.\/intelligence\/IntelligenceFacade['"]/g, "'../IntelligenceFacade'");
  }
  
  // MemoryStore
  if (file.includes('MemoryStore.ts')) {
    content = content.replace(/['"]\.\.\/intelligence\/memory\/MemoryConsolidator['"]/g, "'./MemoryConsolidator'");
  }
  
  // persistArtifacts
  if (file.includes('persistArtifacts.ts')) {
    content = content.replace(/['"]\.\.\/\.\.\/\.\.\/lib\/memory\/MemoryEngine['"]/g, "'@/intelligence/memory/MemoryEngine'");
    content = content.replace(/['"]\.\.\/\.\.\/\.\.\/lib\/intelligence\/graph\/GraphBuilder['"]/g, "'@/intelligence/graph/GraphBuilder'");
    content = content.replace(/\.catch\(e => \{/g, ".catch((e: any) => {");
  }
  
  // Tests
  if (file.includes('testDrift.ts')) {
    content = content.replace(/['"]\.\/src\/lib\/memory\/DriftEngine['"]/g, "'./src/intelligence/drift/DriftEngine'");
  }
  if (file.includes('testImpact.ts')) {
    content = content.replace(/['"]\.\/src\/lib\/memory\/ImpactAnalyzer['"]/g, "'./src/intelligence/impact/ImpactAnalyzer'");
  }
  if (file.includes('testMemory.ts')) {
    content = content.replace(/['"]\.\/src\/lib\/memory\/MemoryEngine['"]/g, "'./src/intelligence/memory/MemoryEngine'");
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed ${path.relative(rootDir, file)}`);
  }
});
