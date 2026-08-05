const fs = require('fs');
const path = require('path');
const srcDir = path.join(__dirname, '../src');

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

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Fix imports in src/agents pointing to knowledge
  if (file.includes(path.join('src', 'agents'))) {
    content = content.replace(/['"]\.\.\/\.\.\/knowledge\/([a-zA-Z0-9_-]+)['"]/g, "'@/lib/knowledge/$1'");
    content = content.replace(/['"]\.\.\/\.\.\/knowledge\/profiles\/([a-zA-Z0-9_-]+)['"]/g, "'@/lib/knowledge/profiles/$1'");
  }
  
  // Fix imports in src/lib/ai/engine pointing to agents
  if (file.includes('Pipeline.ts')) {
    content = content.replace(/['"]\.\.\/agents\/([a-zA-Z0-9_-]+)['"]/g, "'@/agents/$1'");
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed ${path.relative(srcDir, file)}`);
  }
});
