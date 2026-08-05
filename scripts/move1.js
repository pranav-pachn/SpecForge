const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

const moves = [
  { old: 'lib/utils', new: 'shared/utils' },
  { old: 'lib/constants', new: 'shared/constants' },
  { old: 'types', new: 'shared/types' },
  { old: 'components', new: 'shared/components' },
  { old: 'hooks', new: 'shared/hooks' }
];

// Create target directories
const targetDirs = new Set(moves.map(m => path.dirname(path.join(srcDir, m.new))));
targetDirs.forEach(dir => fs.mkdirSync(dir, { recursive: true }));

// Move directories
moves.forEach(m => {
  const oldPath = path.join(srcDir, m.old);
  const newPath = path.join(srcDir, m.new);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`Moved ${m.old} to ${m.new}`);
  }
});

// Update imports
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
  
  moves.forEach(m => {
    // Replace absolute imports @/old -> @/new
    const oldAliasRegex = new RegExp(`@/${m.old.replace(/\//g, '\\/')}`, 'g');
    content = content.replace(oldAliasRegex, `@/${m.new}`);
    
    // Replace relative imports that contain old path name
    // (This is a naive approach but usually works for simple structures)
    const oldNameRegex = new RegExp(`['"]\\.\\.[/a-zA-Z0-9_.-]*${m.old.split('/').pop()}['"]`, 'g');
    content = content.replace(oldNameRegex, `'@/${m.new}'`);
    
    const oldNameRegex2 = new RegExp(`['"]\\.\\.[/a-zA-Z0-9_.-]*${m.old.split('/').pop()}/([^'"]+)['"]`, 'g');
    content = content.replace(oldNameRegex2, `'@/${m.new}/$1'`);
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Updated imports in ${path.relative(srcDir, file)}`);
  }
});

console.log('Layer 1 complete');
