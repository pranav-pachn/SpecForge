const fs = require('fs');
const path = require('path');
const rootDir = path.join(__dirname, '..');

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

fix('src/workflow/artifacts/persistArtifacts.ts', [
  { from: "'./WorkflowContext'", to: "'../engine/WorkflowContext'" },
  { from: '"./WorkflowContext"', to: '"../engine/WorkflowContext"' }
]);

fix('testMemory.ts', [
  { from: "'./src/lib/ai/engine/persistArtifacts'", to: "'./src/workflow/artifacts/persistArtifacts'" },
  { from: "'./src/lib/ai/engine/WorkflowContext'", to: "'./src/workflow/engine/WorkflowContext'" }
]);
