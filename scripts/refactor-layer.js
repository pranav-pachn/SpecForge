const fs = require('fs');
const path = require('path');
const srcDir = path.join(__dirname, '../src');

function moveDirSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const files = fs.readdirSync(src);
  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    if (fs.statSync(srcPath).isDirectory()) {
      moveDirSync(srcPath, destPath);
    } else {
      fs.renameSync(srcPath, destPath);
    }
  }
  fs.rmdirSync(src);
}

const configStr = fs.readFileSync(path.resolve(process.argv[2]), 'utf8');
const config = JSON.parse(configStr);
const moves = config.moves;

// Create target directories
const targetDirs = new Set(moves.map(m => path.dirname(path.join(srcDir, m.new))));
targetDirs.forEach(dir => fs.mkdirSync(dir, { recursive: true }));

// Move directories or files
moves.forEach(m => {
  const oldPath = path.join(srcDir, m.old);
  const newPath = path.join(srcDir, m.new);
  if (fs.existsSync(oldPath)) {
    if (fs.statSync(oldPath).isDirectory()) {
      moveDirSync(oldPath, newPath);
    } else {
      fs.mkdirSync(path.dirname(newPath), { recursive: true });
      fs.renameSync(oldPath, newPath);
    }
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
    let oldImport = m.old;
    if (oldImport.endsWith('.ts') || oldImport.endsWith('.tsx')) {
      oldImport = oldImport.replace(/\.tsx?$/, '');
    }
    let newImport = m.new;
    if (newImport.endsWith('/index.ts')) {
      newImport = newImport.replace(/\/index\.ts$/, '');
    } else if (newImport.endsWith('.ts') || newImport.endsWith('.tsx')) {
      newImport = newImport.replace(/\.tsx?$/, '');
    }
    const oldAliasRegex = new RegExp(`@/${oldImport.replace(/\//g, '\\/')}`, 'g');
    content = content.replace(oldAliasRegex, `@/${newImport}`);
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Updated imports in ${path.relative(srcDir, file)}`);
  }
});

console.log('Layer complete');
