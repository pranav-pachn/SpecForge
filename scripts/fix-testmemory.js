const fs = require('fs');
const path = require('path');
const rootDir = path.join(__dirname, '..');

let content = fs.readFileSync(path.join(rootDir, 'testMemory.ts'), 'utf8');
content = content.replace(/['"]\.\/src\/lib\/ai\/engine\/persistArtifacts['"]/g, "'./src/workflow/artifacts/persistArtifacts'");
content = content.replace(/['"]\.\/src\/lib\/ai\/engine\/WorkflowContext['"]/g, "'./src/workflow/engine/WorkflowContext'");
fs.writeFileSync(path.join(rootDir, 'testMemory.ts'), content, 'utf8');
