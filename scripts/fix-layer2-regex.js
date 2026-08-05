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
// Also include tests in root
['testDrift.ts', 'testImpact.ts', 'testMemory.ts'].forEach(f => {
  if (fs.existsSync(path.join(rootDir, f))) {
    files.push(path.join(rootDir, f));
  }
});

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Replace relative imports to enterprise with absolute to platform
  content = content.replace(/['"](\.\.\/)+enterprise\/([a-zA-Z0-9_/-]+)['"]/g, "'@/platform/$2'");
  
  // Replace relative imports to flags in platform
  content = content.replace(/['"]\.\.\/flags\/CapabilityFlags['"]/g, "'@/platform/config/flags/CapabilityFlags'");
  
  // Replace relative imports to events in platform/telemetry
  content = content.replace(/['"](\.\.\/)+events\/PlatformEventBus['"]/g, "'@/platform/events/PlatformEventBus'");
  
  // Replace test files relative DB paths
  content = content.replace(/['"]\.\/src\/lib\/db['"]/g, "'@/platform/storage/db'");

  // Fix implicit any
  content = content.replace(/payload =>/g, "(payload: any) =>");
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed ${path.relative(rootDir, file)}`);
  }
});
